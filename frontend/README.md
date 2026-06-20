# Frontend — Job Marketplace (Parte B)

UI completa del marketplace en React + TypeScript, con wagmi v2 + RainbowKit + viem +
`@tanstack/react-query`. Extiende el dashboard de la Entrega 1 (panel de cuenta) y de la
Entrega 2 (panel del Multisig) hasta cubrir todo el flujo del marketplace.

## Correr local

```bash
cd frontend
npm install
cp .env.example .env   # completar las variables (ver abajo)
npm run dev
```

Antes de usar el marketplace hace falta completar `src/config.ts` con las direcciones reales
desplegadas (`ADDRESSES.jobMarketplace`, `ADDRESSES.multisig`, `ADDRESSES.mockErc20`) y
`DEPLOY_BLOCK` (el número de bloque del deploy de `JobMarketplace`, usado para no tener que leer
el historial de eventos desde el génesis).

Otros comandos:

```bash
npm run typecheck   # tsc --noEmit
npm run build        # typecheck + build de producción
npm run preview      # sirve el build de producción
```

## Variables de entorno (`.env`)

- `VITE_WALLETCONNECT_PROJECT_ID`: ID de proyecto de [Reown Cloud](https://cloud.reown.com)
  (antes WalletConnect Cloud), gratis. Sin esto, RainbowKit funciona igual con wallets inyectadas
  (MetaMask) pero sin el flujo de WalletConnect/QR para wallets móviles.
- `VITE_SEPOLIA_RPC_URL`: RPC de Sepolia opcional. Si se deja vacío, se usa el RPC público por
  defecto de viem.

## Tokens del Panel de Cuenta (Entrega 1)

El panel de cuenta muestra dos tokens ERC-20 en Sepolia:

1. **MockERC20** propio (`ADDRESSES.mockErc20`) — el mismo token que se usa como escrow del
   marketplace, mintable desde el faucet del contrato.
2. **LINK** de Chainlink en Sepolia (`LINK_TOKEN_ADDRESS` en `config.ts`,
   `0x779877A7B0D9E8603169DdbD7836e478b4624789`) — token de faucet público y documentado. Si no
   resuelve (red distinta, dirección desactualizada), se cambia en un solo lugar.

## Pantallas

- **Panel de Cuenta** (Entrega 1): ENS o address abreviada, saldo ETH a 4 decimales, bloque
  actual en vivo, balances de los 2 tokens.
- **Multisig** (Entrega 2, porteado a este stack): info del contrato (signers/threshold), listar
  propuestas, proponer/aprobar/ejecutar/cancelar.
- **Tablero de Trabajos**: lista de jobs leyendo el evento `JobCreated`.
- **Detalle de Trabajo**: struct completo + panel de acciones según el rol de la wallet conectada
  (cliente/proveedor/evaluador) y el estado del job.
- **Publicar Trabajo**: formulario de `createJob`.

## Evaluador = Multisig

Si el `evaluator` de un job es la dirección del Multisig, en el Detalle de Trabajo aparece un
panel "Evaluador: Multisig" para los firmantes: los botones "Proponer Aprobar"/"Proponer
Rechazar" generan el calldata de `complete`/`reject` con viem y lo mandan a `propose()`. La
ejecución real (`complete`/`reject` sobre `JobMarketplace`) ocurre recién cuando el resto de los
firmantes aprueba desde la pestaña **Multisig** y alguien llama a `execute()` — todo dentro de
esta misma app, sin herramientas externas.

## El deliverable (localStorage)

El proveedor escribe el contenido de la entrega en `localStorage` de su navegador y manda
`deliverableRef = keccak256(contenido)` on-chain. El evaluador lee el contenido desde su propio
`localStorage` usando ese ref — si está en un navegador distinto al del proveedor, no lo va a
encontrar (limitación conocida y aceptada para esta entrega; alternativas: base de datos o IPFS).

## Decisiones de diseño específicas del frontend

- Todas las lecturas de contrato pasan por `@tanstack/react-query` + un `PublicClient` de viem,
  con query keys centralizadas (`src/lib/queryKeys.ts`), en vez de depender de las keys internas
  que genera wagmi — así la invalidación cruzada entre escrituras y lecturas es explícita.
- Sin router: 4 pantallas, navegación con un estado simple en `App.tsx`.
- El número de bloque (Entrega 1) y el chequeo de expiración de jobs (Entrega Final) comparten la
  misma fuente de "tiempo de la chain" (`useChainTime`, basado en `useBlock({watch:true})` de
  wagmi) en vez de que cada uno haga su propio polling.
- La expiración de un job se calcula contra el timestamp del último bloque, no el reloj del
  navegador, para no mostrar "Reclamar Reembolso" disponible cuando el contrato todavía
  revertiría `NotExpired`.
- `reason` en `complete`/`reject` es un campo de texto libre opcional, hasheado con `keccak256`
  antes de mandarlo como `bytes32` (mismo patrón que `deliverableRef`).
