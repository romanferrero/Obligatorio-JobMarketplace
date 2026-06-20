# Job Marketplace
- Roman Ferrero(257405)
- Santiago Pedetti(284038)

Obligatorio final de Taller de Tecnologías 2. Es un marketplace de trabajos arriba de Ethereum que usa un escrow con un token ERC-20, inspirado en [ERC-8183](https://eips.ethereum.org/EIPS/eip-8183).

Cada trabajo tiene tres roles: el **cliente** que publica y pone la plata, el **proveedor** que hace el laburo, y el **evaluador** que revisa y decide si se paga o se devuelve. El evaluador puede ser una persona o un contrato — si le ponés el Multisig como evaluador, `complete` solo se ejecuta cuando los firmantes llegan al threshold. No hicimos nada especial para eso, sale del diseño.

## Contratos

- `JobMarketplace.sol` — el marketplace propiamente dicho, con el escrow. El token de pago queda fijo en el deploy.
- `Multisig.sol` — el contrato de firma múltiple de la Entrega 2, acá lo reusamos como evaluador.
- `MockERC20.sol` — un token ERC-20 con `mint` público para poder probar en testnet y en los tests.

### Funciones del marketplace

| Función | Quién | Qué hace |
|---|---|---|
| `createJob(description, budget, evaluator, provider, expiresAt)` | Cualquiera | Crea un trabajo en `Open`. Evaluador obligatorio, proveedor opcional. |
| `setProvider(jobId, provider)` | Cliente | Le asigna proveedor a un trabajo `Open` que no tiene. |
| `fund(jobId)` | Cliente | Mete el budget en el escrow. Necesita que ya haya proveedor. |
| `submit(jobId, deliverableRef)` | Proveedor | Marca el trabajo como `Submitted` con una referencia al entregable. |
| `complete(jobId, reason)` | Evaluador | Aprueba y le paga al proveedor. |
| `reject(jobId, reason)` | Cliente (`Open`) / Evaluador (`Funded`/`Submitted`) | Devuelve la plata al cliente. |
| `claimRefund(jobId)` | Cualquiera | Si venció, reembolsa al cliente. No tiene restricción de acceso. |

## Tests

```bash
npm install
npx hardhat test
```

Qué cubren:

- Camino feliz completo (crear → fondear → entregar → completar).
- Rechazos en los tres estados donde aplica.
- Expiración y `claimRefund` desde `Funded` y `Submitted`.
- Control de acceso: que cada función restringida revierte si la llama alguien que no debe.
- Multisig como evaluador: se despliega, se asigna, y se verifica que `complete` no pasa hasta que el threshold se cumple y se ejecuta la propuesta.

## Deploy en Sepolia

1. Copiar `.env.example` a `.env` y completar `SEPOLIA_RPC_URL` y `PRIVATE_KEY`.
2. Ajustar `SIGNERS` y `THRESHOLD` en `scripts/deploy.js` con las wallets del equipo.
3. Correr:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Direcciones desplegadas

| Contrato | Dirección |
|---|---|
| `JobMarketplace` | [`0x539921fD1B45D91bE223233cB5212f1C85c3A2e9`](https://sepolia.etherscan.io/address/0x539921fD1B45D91bE223233cB5212f1C85c3A2e9) |
| `Multisig` | [`0x02BE7B5850188DAD378A6D300CCE543F0a07EFB5`](https://sepolia.etherscan.io/address/0x02BE7B5850188DAD378A6D300CCE543F0a07EFB5) |
| `MockERC20` | [`0xfD80936c7284167a72B5Bc9cff57A04F96D6293d`](https://sepolia.etherscan.io/address/0xfD80936c7284167a72B5Bc9cff57A04F96D6293d) |

## Frontend

Hecho en React + TypeScript con wagmi v2, RainbowKit, viem y React Query. Arranca del panel de cuenta de la Entrega 1 y el Multisig de la Entrega 2, y le agrega todo el flujo del marketplace: tablero de trabajos, detalle con acciones según tu rol, formulario para publicar, y la posibilidad de usar el Multisig como evaluador directo desde la app.

```bash
cd frontend
npm install
cp .env.example .env   # completar VITE_WALLETCONNECT_PROJECT_ID y opcionalmente VITE_SEPOLIA_RPC_URL
npm run dev
```

Las direcciones de los contratos y el bloque de deploy van en `frontend/src/config.ts`. Más detalles en [frontend/README.md](frontend/README.md).

## Decisiones de diseño

**Seguridad del contrato** — Usamos `SafeERC20` para las transferencias y `ReentrancyGuard` en todo lo que mueve fondos. Seguimos el patrón checks-effects-interactions en todas las funciones.

**La descripción no se guarda on-chain** — Solo viaja en el evento `JobCreated`. El frontend la lee de los logs. Guardarla en storage sería caro al pedo.

**Entregables off-chain** — On-chain solo queda el `deliverableRef` (un `bytes32`, el hash del contenido). El contenido real lo manejamos con localStorage en el frontend. Es la opción más simple de las que daba la consigna y alcanza para lo que se pide. La limitación es que el evaluador tiene que estar en el mismo navegador que el proveedor para ver el contenido.

**Multisig como evaluador** — No necesitó código extra. El Multisig llama a `complete` o `reject` cuando sus firmantes llegan al threshold y ejecutan la propuesta. Desde el frontend se puede armar el calldata y mandarlo a `propose` sin salir de la pantalla de detalle del trabajo.

**Stack del frontend** — Pasamos de JavaScript + ethers + `window.ethereum` (Entrega 1) a TypeScript estricto con wagmi v2, viem, RainbowKit y React Query. Las lecturas al contrato pasan por React Query con query keys propias para poder invalidar puntualmente después de cada escritura, sin depender de las keys internas de wagmi.

## Diferencias con ERC-8183

- El `budget` se define en `createJob` y es inmutable. El ERC tiene un `setBudget` aparte, pero la consigna lo pedía así.
- `fund` requiere que el proveedor ya esté asignado. Si no, el trabajo queda fondeado pero nadie puede hacer `submit` (porque `setProvider` solo anda en `Open` y `submit` solo en `Funded`). Nos pareció más seguro.
- No implementamos fees ni hooks del ERC. La consigna no los pide y agregan complejidad sin aportar a lo que se evalúa.
