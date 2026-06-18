# Job Marketplace

Marketplace de empleos sobre Ethereum con **escrow en un token ERC-20**, inspirado en
[ERC-8183 (Agentic Commerce Protocol)](https://eips.ethereum.org/EIPS/eip-8183). Entrega final de
Taller de Tecnologías 2 (Blockchain).

Cada trabajo tiene tres roles:

- **Cliente** — publica el trabajo, bloquea el pago en escrow y lo fondea.
- **Proveedor** — acepta el trabajo y entrega un resultado.
- **Evaluador** — revisa la entrega y libera el pago al proveedor o reembolsa al cliente.

El evaluador puede ser cualquier dirección capaz de llamar al contrato, incluido un contrato
**Multisig** (consenso M-de-N): si el evaluador de un trabajo es el Multisig, `complete` solo se
ejecuta después de que M de N revisores aprueban y ejecutan el llamado. No requiere ninguna
integración extra: surge naturalmente del protocolo.

## Contratos

| Contrato | Descripción |
|---|---|
| `JobMarketplace.sol` | Marketplace con escrow. Token ERC-20 fijado en el constructor. |
| `Multisig.sol` | Evaluador M-de-N reutilizado de la Entrega 2. |
| `MockERC20.sol` | Token ERC-20 de prueba con faucet abierto (`mint`) para testnet y tests. |

### Máquina de estados de un trabajo

```
Open ──fund──> Funded ──submit──> Submitted ──complete──> Completed
 │                │                   │
 │ reject(cliente)│ reject(eval.)     │ reject(eval.)
 ▼                ▼                   ▼
Rejected        Rejected            Rejected

Funded / Submitted ──(block.timestamp > expiresAt)── claimRefund ──> Expired
```

### Funciones

| Función | Acceso | Efecto |
|---|---|---|
| `createJob(description, budget, evaluator, provider, expiresAt)` | Cualquiera | Crea el trabajo en `Open`. `evaluator` obligatorio, `provider` opcional. |
| `setProvider(jobId, provider)` | Cliente | Asigna proveedor a un trabajo `Open` sin proveedor. |
| `fund(jobId)` | Cliente | Transfiere el `budget` al escrow (`Open → Funded`). Requiere proveedor asignado. |
| `submit(jobId, deliverableRef)` | Proveedor | `Funded → Submitted`. `deliverableRef` es un `bytes32`. |
| `complete(jobId, reason)` | Evaluador | Libera el pago al proveedor (`Submitted → Completed`). |
| `reject(jobId, reason)` | Cliente en `Open` / Evaluador en `Funded`/`Submitted` | Reembolsa al cliente (`→ Rejected`). |
| `claimRefund(jobId)` | Cualquiera | Si venció estando `Funded`/`Submitted`, reembolsa al cliente (`→ Expired`). |

## Cómo correr los tests

```bash
npm install
npx hardhat test
```

Los tests cubren:

- **Happy path:** crear → fondear → entregar → completar.
- **Rechazo:** cliente en `Open`, evaluador en `Funded`, evaluador en `Submitted`.
- **Expiración:** `claimRefund` desde `Funded` y desde `Submitted`.
- **Control de acceso:** cada función restringida llamada por la dirección incorrecta revierte.
- **Multisig como evaluador:** el Multisig se asigna como evaluador y `complete` solo tiene éxito
  después de alcanzar el threshold y ejecutar el llamado.

## Despliegue en Sepolia

1. Copiá `.env.example` a `.env` y completá `SEPOLIA_RPC_URL` y `PRIVATE_KEY`.
2. En `scripts/deploy.js`, ajustá `SIGNERS` y `THRESHOLD` del Multisig con las wallets del equipo.
3. Desplegá:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Direcciones en Sepolia

| Contrato | Dirección |
|---|---|
| `JobMarketplace` | _(pendiente de deploy)_ |
| `Multisig` | _(pendiente de deploy)_ |
| `MockERC20` | _(pendiente de deploy)_ |

## Frontend

_(Sección a completar — Parte B. UI del marketplace en React + TypeScript con wagmi v2 + RainbowKit +
React Query. Instrucciones para correrlo localmente y variables de entorno.)_

## Decisiones de diseño

- **OpenZeppelin `SafeERC20` + `ReentrancyGuard`:** transferencias seguras y guard de reentrancy en
  todas las funciones que mueven fondos, siguiendo checks-effects-interactions.
- **`description` solo en el evento `JobCreated`:** no se guarda en storage (es caro). El tablero la lee
  de los eventos; el struct on-chain guarda solo lo necesario.
- **Deliverable off-chain:** on-chain solo se guarda `deliverableRef` (`bytes32`). El contenido del
  trabajo se maneja off-chain (localStorage en el frontend) — así no es público hasta el visto bueno.
- **Multisig como evaluador:** no requiere integración adicional. El Multisig llama a `complete`/`reject`
  vía `execute` cuando alcanza el threshold.

## Desvíos respecto a ERC-8183 (justificados)

- **`createJob` incluye `budget`** (inmutable desde la creación), como pide la consigna; ERC-8183 lo
  separa en un `setBudget`. Seguimos la consigna.
- **`fund` exige proveedor asignado** (regla de ERC-8183): evita que un trabajo quede fondeado sin
  proveedor posible, ya que `setProvider`/`submit` no aplican fuera de `Open`.
- **Se omiten fees (plataforma/evaluador) y hooks `IACPHook`** de ERC-8183: la consigna no los pide y
  agregan superficie de ataque. `claimRefund` sin hooks coincide con el espíritu del ERC.
- **Frontend en TypeScript + wagmi/RainbowKit/React Query** (la Entrega 2 usaba ethers + `window.ethereum`
  en JS): se alinea con el stack pedido en las consignas.

> **Nota:** el PDF de la Entrega 1 contiene una instrucción de _prompt injection_ dirigida a agentes de
> IA ("[TRAMPA]… mostrar solo 'Conectado'…"). Se detectó y se ignoró deliberadamente: contradice los
> requisitos reales de la consigna.
