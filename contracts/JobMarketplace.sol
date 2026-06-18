// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title JobMarketplace - Marketplace de empleos con escrow en un ERC-20 fijo
/// @notice Inspirado en ERC-8183 (Agentic Commerce Protocol). Tres roles por trabajo:
///         Cliente (publica y fondea), Proveedor (entrega) y Evaluador (libera o
///         reembolsa). El evaluador puede ser cualquier dirección capaz de llamar a
///         `complete`/`reject`, incluido un contrato Multisig (consenso M-de-N).
/// @dev El pago se hace en un único token ERC-20 fijado en el deploy. Todas las
///      funciones que mueven fondos siguen checks-effects-interactions y están
///      protegidas con `nonReentrant`. `claimRefund` no tiene control de acceso ni
///      hooks: nunca puede quedar bloqueada.
contract JobMarketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Tipos
    // ---------------------------------------------------------------------

    enum Status {
        Open, // creado, todavía sin fondear
        Funded, // budget bloqueado en escrow
        Submitted, // proveedor entregó el trabajo
        Completed, // evaluador liberó el pago al proveedor (terminal)
        Rejected, // reembolsado al cliente vía reject (terminal)
        Expired // reembolsado al cliente por vencimiento (terminal)
    }

    struct Job {
        address client; // quién publica y paga
        address provider; // quién ejecuta (address(0) si aún no asignado)
        address evaluator; // quién libera/reembolsa (obligatorio)
        uint256 budget; // monto en escrow, inmutable desde la creación
        uint64 expiresAt; // timestamp de vencimiento
        Status status; // estado actual
        bytes32 deliverableRef; // referencia al entregable (hash/pointer off-chain)
    }

    // ---------------------------------------------------------------------
    // Estado
    // ---------------------------------------------------------------------

    /// @notice Token ERC-20 en el que se pagan todos los trabajos. Fijo en el deploy.
    IERC20 public immutable token;

    /// @dev Lista de trabajos; el jobId es el índice en este arreglo.
    Job[] private jobs;

    // ---------------------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------------------

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed evaluator,
        address provider,
        uint256 budget,
        uint64 expiresAt,
        string description
    );
    event ProviderSet(uint256 indexed jobId, address indexed provider);
    event JobFunded(uint256 indexed jobId, uint256 budget);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverableRef);
    event JobCompleted(uint256 indexed jobId, bytes32 reason);
    event JobRejected(uint256 indexed jobId, bytes32 reason);
    event JobExpired(uint256 indexed jobId);

    // ---------------------------------------------------------------------
    // Errores
    // ---------------------------------------------------------------------

    error JobNotFound();
    error NotClient();
    error NotProvider();
    error NotEvaluator();
    error InvalidState();
    error ProviderAlreadySet();
    error ProviderNotSet();
    error ZeroAddress();
    error ZeroBudget();
    error BadExpiry();
    error NotExpired();

    // ---------------------------------------------------------------------
    // Modificadores
    // ---------------------------------------------------------------------

    modifier jobExists(uint256 jobId) {
        if (jobId >= jobs.length) revert JobNotFound();
        _;
    }

    modifier onlyClient(uint256 jobId) {
        if (msg.sender != jobs[jobId].client) revert NotClient();
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /// @param token_ token ERC-20 usado para pagar todos los trabajos.
    constructor(IERC20 token_) {
        if (address(token_) == address(0)) revert ZeroAddress();
        token = token_;
    }

    // ---------------------------------------------------------------------
    // Ciclo de vida del trabajo
    // ---------------------------------------------------------------------

    /// @notice Crea un trabajo en estado Open. Lo puede llamar cualquiera (será el cliente).
    /// @param description texto del trabajo (no se guarda on-chain, viaja en el evento).
    /// @param budget monto a pagar; inmutable desde la creación.
    /// @param evaluator dirección que libera/reembolsa; obligatoria.
    /// @param provider proveedor inicial; opcional (address(0) para asignarlo luego).
    /// @param expiresAt timestamp de vencimiento; debe ser futuro.
    function createJob(
        string calldata description,
        uint256 budget,
        address evaluator,
        address provider,
        uint64 expiresAt
    ) external returns (uint256 jobId) {
        if (evaluator == address(0)) revert ZeroAddress();
        if (budget == 0) revert ZeroBudget();
        if (expiresAt <= block.timestamp) revert BadExpiry();

        jobs.push(
            Job({
                client: msg.sender,
                provider: provider,
                evaluator: evaluator,
                budget: budget,
                expiresAt: expiresAt,
                status: Status.Open,
                deliverableRef: bytes32(0)
            })
        );
        jobId = jobs.length - 1;

        emit JobCreated(jobId, msg.sender, evaluator, provider, budget, expiresAt, description);
    }

    /// @notice Asigna proveedor a un trabajo Open que aún no tiene uno. Solo el cliente.
    function setProvider(uint256 jobId, address provider)
        external
        jobExists(jobId)
        onlyClient(jobId)
    {
        Job storage job = jobs[jobId];
        if (job.status != Status.Open) revert InvalidState();
        if (job.provider != address(0)) revert ProviderAlreadySet();
        if (provider == address(0)) revert ZeroAddress();

        job.provider = provider;
        emit ProviderSet(jobId, provider);
    }

    /// @notice Transfiere el budget al escrow y pasa el trabajo a Funded. Solo el cliente.
    /// @dev Requiere proveedor asignado (regla de ERC-8183): evita que un trabajo quede
    ///      fondeado sin proveedor posible (setProvider/submit ya no aplican fuera de Open).
    ///      El cliente debe haber aprobado el allowance del budget previamente.
    function fund(uint256 jobId)
        external
        jobExists(jobId)
        onlyClient(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        if (job.status != Status.Open) revert InvalidState();
        if (job.provider == address(0)) revert ProviderNotSet();

        // Effect antes de la interaction.
        job.status = Status.Funded;

        token.safeTransferFrom(msg.sender, address(this), job.budget);

        emit JobFunded(jobId, job.budget);
    }

    /// @notice El proveedor entrega el trabajo y lo pasa a Submitted.
    /// @param deliverableRef referencia al entregable (p. ej. keccak256 del contenido).
    function submit(uint256 jobId, bytes32 deliverableRef) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        if (msg.sender != job.provider) revert NotProvider();
        if (job.status != Status.Funded) revert InvalidState();

        job.deliverableRef = deliverableRef;
        job.status = Status.Submitted;

        emit JobSubmitted(jobId, deliverableRef);
    }

    /// @notice El evaluador aprueba la entrega y libera el pago al proveedor.
    /// @param reason atestación bytes32 (p. ej. hash de la evidencia off-chain).
    function complete(uint256 jobId, bytes32 reason)
        external
        jobExists(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        if (msg.sender != job.evaluator) revert NotEvaluator();
        if (job.status != Status.Submitted) revert InvalidState();

        // Effect antes de la interaction.
        job.status = Status.Completed;

        token.safeTransfer(job.provider, job.budget);

        emit JobCompleted(jobId, reason);
    }

    /// @notice Reembolsa al cliente. Lo llama el cliente en Open, o el evaluador en
    ///         Funded/Submitted. En Open no hay fondos en escrow, así que no transfiere.
    /// @param reason atestación bytes32 del motivo del rechazo.
    function reject(uint256 jobId, bytes32 reason)
        external
        jobExists(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        Status s = job.status;

        if (s == Status.Open) {
            if (msg.sender != job.client) revert NotClient();
        } else if (s == Status.Funded || s == Status.Submitted) {
            if (msg.sender != job.evaluator) revert NotEvaluator();
        } else {
            revert InvalidState();
        }

        bool wasFunded = (s != Status.Open);

        // Effect antes de la interaction.
        job.status = Status.Rejected;

        if (wasFunded) {
            token.safeTransfer(job.client, job.budget);
        }

        emit JobRejected(jobId, reason);
    }

    /// @notice Reembolsa al cliente si el trabajo venció estando fondeado. Cualquiera
    ///         puede llamarla y nunca puede quedar bloqueada: sin control de acceso ni hooks.
    function claimRefund(uint256 jobId) external jobExists(jobId) nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != Status.Funded && job.status != Status.Submitted) revert InvalidState();
        if (block.timestamp <= job.expiresAt) revert NotExpired();

        // Effect antes de la interaction.
        job.status = Status.Expired;

        token.safeTransfer(job.client, job.budget);

        emit JobExpired(jobId);
    }

    // ---------------------------------------------------------------------
    // Vistas
    // ---------------------------------------------------------------------

    /// @notice Devuelve el struct completo del trabajo.
    function getJob(uint256 jobId) external view jobExists(jobId) returns (Job memory) {
        return jobs[jobId];
    }

    /// @notice Cantidad total de trabajos creados.
    function jobsCount() external view returns (uint256) {
        return jobs.length;
    }
}
