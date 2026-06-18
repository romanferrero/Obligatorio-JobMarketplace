# Para arrancar el frontend (Santi)

Acá están los ABIs y la config de los contratos para que puedas empezar la Parte B sin esperar el deploy.

## Qué hay en `src/`

- `abi/jobMarketplace.ts`, `abi/multisig.ts`, `abi/mockERC20.ts` — los ABIs exportados `as const`
  (importás desde `abi/index.ts`). Están tipados para wagmi/viem.
- `config.ts` — direcciones de los contratos (a completar después del deploy), el enum `JobStatus`,
  las labels de estado y el tipo `Job` que devuelve `getJob`.

> Los ABIs se generan desde `artifacts/` al compilar. Si cambia el contrato, recompilar
> (`npx hardhat compile`) y volver a exportarlos.

## Funciones del contrato (resumen rápido)

Lecturas:
- `getJob(jobId) -> Job` (struct con client, provider, evaluator, budget, expiresAt, status, deliverableRef)
- `jobsCount() -> uint256`
- `token() -> address` (el ERC-20 de pago)

Escrituras:
- `createJob(description, budget, evaluator, provider, expiresAt)`
- `setProvider(jobId, provider)`
- `fund(jobId)` — antes hay que hacer `approve` del budget en el ERC-20
- `submit(jobId, deliverableRef)`
- `complete(jobId, reason)`
- `reject(jobId, reason)`
- `claimRefund(jobId)`

## Eventos (para el tablero)

El tablero se arma leyendo el evento `JobCreated`:

```
JobCreated(uint256 jobId, address client, address evaluator, address provider,
           uint256 budget, uint64 expiresAt, string description)
```

La `description` viaja en este evento (no está en el struct on-chain), así que de acá sacás el texto
de cada trabajo. Con el `jobId` después leés `getJob(jobId)` para el estado actual.

Otros eventos: `ProviderSet`, `JobFunded`, `JobSubmitted`, `JobCompleted`, `JobRejected`, `JobExpired`.

## El deliverable (localStorage)

On-chain solo se guarda `deliverableRef` (un `bytes32`). El plan es: cuando el proveedor entrega,
guardás el contenido en `localStorage` y mandás `deliverableRef = keccak256(contenido)` al `submit`.
El evaluador lee el contenido de su `localStorage` usando ese ref.

## Stack acordado

React + TypeScript + wagmi v2 + RainbowKit + React Query + viem (mismo stack de las consignas).
