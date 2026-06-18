# Job Marketplace

Marketplace de empleos sobre Ethereum con escrow en un token ERC-20, basado en la idea de
[ERC-8183 (Agentic Commerce Protocol)](https://eips.ethereum.org/EIPS/eip-8183). Este es nuestro
trabajo final de Taller de Tecnologías 2.

La idea es simple: cada trabajo tiene tres roles.

- **Cliente**: publica el trabajo, bloquea la plata en el escrow y lo fondea.
- **Proveedor**: agarra el trabajo y entrega el resultado.
- **Evaluador**: revisa la entrega y decide si libera el pago al proveedor o le devuelve la plata al cliente.

Lo interesante es que el evaluador puede ser cualquier dirección que pueda llamar al contrato, así que
también puede ser un contrato **Multisig**. Si el evaluador de un trabajo es el Multisig, entonces
`complete` recién se ejecuta cuando M de N firmantes aprueban y ejecutan el llamado. No hay que hacer
nada especial para que esto funcione, sale solo del diseño.

## Contratos

| Contrato | Para qué |
|---|---|
| `JobMarketplace.sol` | El marketplace con el escrow. El token ERC-20 se fija al hacer el deploy. |
| `Multisig.sol` | El evaluador M-de-N que reusamos de la Entrega 2. |
| `MockERC20.sol` | Un token ERC-20 de prueba con `mint` abierto para poder fondear en testnet y en los tests. |

### Funciones

| Función | Quién la puede llamar | Qué hace |
|---|---|---|
| `createJob(description, budget, evaluator, provider, expiresAt)` | Cualquiera | Crea el trabajo en `Open`. El evaluador es obligatorio, el proveedor es opcional. |
| `setProvider(jobId, provider)` | Cliente | Asigna proveedor a un trabajo `Open` que todavía no tiene. |
| `fund(jobId)` | Cliente | Manda el budget al escrow (`Open → Funded`). Necesita que el proveedor ya esté asignado. |
| `submit(jobId, deliverableRef)` | Proveedor | Pasa el trabajo a `Submitted`. El `deliverableRef` es un `bytes32`. |
| `complete(jobId, reason)` | Evaluador | Libera el pago al proveedor (`Submitted → Completed`). |
| `reject(jobId, reason)` | Cliente en `Open` / Evaluador en `Funded` o `Submitted` | Le devuelve la plata al cliente (`→ Rejected`). |
| `claimRefund(jobId)` | Cualquiera | Si el trabajo venció estando `Funded` o `Submitted`, reembolsa al cliente (`→ Expired`). |

## Correr los tests

```bash
npm install
npx hardhat test
```

Los tests cubren:

- El camino feliz: crear → fondear → entregar → completar.
- Rechazos: el cliente rechaza en `Open`, el evaluador rechaza en `Funded` y en `Submitted`.
- Expiración: `claimRefund` desde `Funded` y desde `Submitted`.
- Control de acceso: cada función restringida llamada por la dirección equivocada revierte.
- El Multisig como evaluador: se asigna el Multisig como evaluador y `complete` recién funciona cuando
  se alcanza el threshold y se ejecuta el llamado.

## Deploy en Sepolia

1. Copiá `.env.example` a `.env` y completá `SEPOLIA_RPC_URL` y `PRIVATE_KEY`.
2. En `scripts/deploy.js` poné los `SIGNERS` y el `THRESHOLD` del Multisig con las wallets del equipo.
3. Corré:

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

_(Pendiente — Parte B. UI del marketplace en React + TypeScript con wagmi v2, RainbowKit y React Query.
Acá van las instrucciones para correrlo local y las variables de entorno.)_

## Decisiones de diseño

- Usamos `SafeERC20` y `ReentrancyGuard` de OpenZeppelin: transferencias seguras y guard de reentrancy
  en todas las funciones que mueven plata, siguiendo checks-effects-interactions.
- La `description` la mandamos solo en el evento `JobCreated`, no la guardamos en storage (sale caro).
  El tablero del frontend la lee de los eventos.
- El entregable va off-chain: on-chain guardamos nada más que el `deliverableRef` (`bytes32`). El
  contenido real del trabajo se maneja afuera (en el frontend con localStorage), así no queda público
  hasta que el evaluador da el ok.
- El Multisig como evaluador no necesita ninguna integración extra: cuando llega al threshold, llama a
  `complete` o `reject` a través de su `execute`.

## Cosas que cambiamos respecto a ERC-8183

- Pusimos el `budget` dentro de `createJob` y lo dejamos inmutable, como pedía la consigna. El ERC lo
  maneja aparte con un `setBudget`, pero nosotros seguimos la consigna.
- `fund` exige que el proveedor ya esté asignado (esto lo tomamos del ERC). Si no, un trabajo podría
  quedar fondeado sin proveedor posible, porque `setProvider` y `submit` no andan fuera de `Open`.
- No implementamos las fees ni los hooks que propone el ERC, porque la consigna no los pide y solo
  agregan más superficie para que algo falle.
