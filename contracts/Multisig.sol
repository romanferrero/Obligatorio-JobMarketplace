// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Multisig - Contrato de firma múltiple programático
/// @notice Almacena una lista fija de signers y requiere `threshold` aprobaciones
///         on-chain para ejecutar una propuesta. La "firma múltiple" es lógica:
///         son N transacciones de aprobación, no una firma criptográfica agregada.
/// @dev Signers fijos en el deploy. Sigue el patrón checks-effects-interactions
///      y un guard de reentrancy para proteger la ejecución de propuestas con valor.
///      Reutilizado de la Entrega 2 para actuar como evaluador del JobMarketplace.
contract Multisig {
    // ---------------------------------------------------------------------
    // Tipos
    // ---------------------------------------------------------------------

    enum Status {
        Pending,
        Executed,
        Cancelled
    }

    struct Proposal {
        address proposer; // signer que creó la propuesta
        address to; // destino de la transacción
        uint256 value; // monto en wei a enviar
        bytes data; // calldata opcional
        uint256 approvals; // cantidad de aprobaciones acumuladas
        Status status; // estado actual
    }

    // ---------------------------------------------------------------------
    // Estado
    // ---------------------------------------------------------------------

    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;

    Proposal[] private proposals;
    // proposalId => signer => aprobó?
    mapping(uint256 => mapping(address => bool)) public approvedBy;

    uint256 private _locked = 1; // guard de reentrancy (1 = libre, 2 = bloqueado)

    // ---------------------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------------------

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed to,
        uint256 value,
        bytes data
    );
    event Approved(uint256 indexed proposalId, address indexed signer, uint256 approvals);
    event Executed(uint256 indexed proposalId, address indexed executor);
    event Cancelled(uint256 indexed proposalId, address indexed proposer);
    event Deposit(address indexed from, uint256 amount);

    // ---------------------------------------------------------------------
    // Errores
    // ---------------------------------------------------------------------

    error NotSigner();
    error InvalidThreshold();
    error DuplicateSigner();
    error ZeroAddress();
    error NoSigners();
    error ProposalNotFound();
    error NotPending();
    error AlreadyApproved();
    error NotEnoughApprovals();
    error NotProposer();
    error ExecutionFailed();
    error Reentrancy();

    // ---------------------------------------------------------------------
    // Modificadores
    // ---------------------------------------------------------------------

    modifier onlySigner() {
        if (!isSigner[msg.sender]) revert NotSigner();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 2) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier exists(uint256 proposalId) {
        if (proposalId >= proposals.length) revert ProposalNotFound();
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /// @param _signers lista de direcciones autorizadas (fija)
    /// @param _threshold mínimo de aprobaciones para ejecutar
    constructor(address[] memory _signers, uint256 _threshold) {
        if (_signers.length == 0) revert NoSigners();
        if (_threshold == 0 || _threshold > _signers.length) revert InvalidThreshold();

        for (uint256 i = 0; i < _signers.length; i++) {
            address s = _signers[i];
            if (s == address(0)) revert ZeroAddress();
            if (isSigner[s]) revert DuplicateSigner();
            isSigner[s] = true;
            signers.push(s);
        }
        threshold = _threshold;
    }

    // ---------------------------------------------------------------------
    // Recepción de fondos
    // ---------------------------------------------------------------------

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // ---------------------------------------------------------------------
    // Flujo principal
    // ---------------------------------------------------------------------

    /// @notice Crea una propuesta. Solo signers.
    function propose(address to, uint256 value, bytes calldata data)
        external
        onlySigner
        returns (uint256 proposalId)
    {
        if (to == address(0)) revert ZeroAddress();

        proposals.push(
            Proposal({
                proposer: msg.sender,
                to: to,
                value: value,
                data: data,
                approvals: 0,
                status: Status.Pending
            })
        );
        proposalId = proposals.length - 1;

        emit ProposalCreated(proposalId, msg.sender, to, value, data);

        // El proponente aprueba automáticamente su propia propuesta.
        _approve(proposalId);
    }

    /// @notice Aprueba una propuesta pendiente. Un signer no puede aprobar dos veces.
    function approve(uint256 proposalId) external onlySigner exists(proposalId) {
        _approve(proposalId);
    }

    function _approve(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        if (p.status != Status.Pending) revert NotPending();
        if (approvedBy[proposalId][msg.sender]) revert AlreadyApproved();

        approvedBy[proposalId][msg.sender] = true;
        p.approvals += 1;

        emit Approved(proposalId, msg.sender, p.approvals);
    }

    /// @notice Ejecuta una propuesta que alcanzó el threshold. Solo signers.
    function execute(uint256 proposalId)
        external
        onlySigner
        exists(proposalId)
        nonReentrant
    {
        Proposal storage p = proposals[proposalId];
        if (p.status != Status.Pending) revert NotPending();
        if (p.approvals < threshold) revert NotEnoughApprovals();

        // Effect antes de la interaction (checks-effects-interactions).
        p.status = Status.Executed;

        (bool ok, ) = p.to.call{value: p.value}(p.data);
        if (!ok) revert ExecutionFailed();

        emit Executed(proposalId, msg.sender);
    }

    /// @notice Cancela una propuesta pendiente. Solo el proponente original.
    function cancel(uint256 proposalId) external exists(proposalId) {
        Proposal storage p = proposals[proposalId];
        if (msg.sender != p.proposer) revert NotProposer();
        if (p.status != Status.Pending) revert NotPending();

        p.status = Status.Cancelled;
        emit Cancelled(proposalId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Vistas
    // ---------------------------------------------------------------------

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function signersCount() external view returns (uint256) {
        return signers.length;
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 proposalId)
        external
        view
        exists(proposalId)
        returns (
            address proposer,
            address to,
            uint256 value,
            bytes memory data,
            uint256 approvals,
            Status status
        )
    {
        Proposal storage p = proposals[proposalId];
        return (p.proposer, p.to, p.value, p.data, p.approvals, p.status);
    }

    function hasApproved(uint256 proposalId, address signer) external view returns (bool) {
        return approvedBy[proposalId][signer];
    }
}
