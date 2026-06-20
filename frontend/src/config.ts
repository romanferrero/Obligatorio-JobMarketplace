// Direcciones de los contratos y datos de red.
// Completar las direcciones después del deploy a Sepolia (salen del output de
// `npx hardhat run scripts/deploy.js --network sepolia`).

export const SEPOLIA_CHAIN_ID = 11155111;

export const ADDRESSES = {
  jobMarketplace: "0x0000000000000000000000000000000000000000",
  multisig: "0x0000000000000000000000000000000000000000",
  mockErc20: "0x0000000000000000000000000000000000000000",
} as const;

// Bloque en el que se desplegó JobMarketplace en Sepolia. Sirve como `fromBlock`
// para leer el historial de eventos `JobCreated` sin escanear toda la chain.
// Completar con el número de bloque que imprime el deploy (recibo de la tx de
// deploy de JobMarketplace, visible también en Etherscan).
export const DEPLOY_BLOCK = 0n;

// Token de prueba #2 para el Panel de Cuenta (requerimiento de la Entrega 1: dos
// tokens ERC-20 en Sepolia). El token #1 es nuestro propio MockERC20 (ADDRESSES.mockErc20).
// Esta es la dirección pública y documentada del LINK de Chainlink en Sepolia (faucet:
// https://faucets.chain.link/sepolia). Verificar en Sepolia Etherscan si no resuelve.
export const LINK_TOKEN_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789" as const;

// Intervalo de refresco (ms) para datos "en vivo" sin soporte de eventos: bloque
// actual, timestamp del último bloque, balances de ETH/tokens.
export const POLL_INTERVAL_MS = 4000;

// MockERC20 no sobreescribe decimals(), así que hereda el default de OZ (18).
// Se usa para formatear budgets sin tener que leer decimals() en cada lugar
// donde se muestra un monto del token de escrow.
export const ESCROW_TOKEN_DECIMALS = 18;

// Estados del trabajo. El orden coincide con el enum Status del contrato:
// Open=0, Funded=1, Submitted=2, Completed=3, Rejected=4, Expired=5.
export enum JobStatus {
  Open = 0,
  Funded = 1,
  Submitted = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  [JobStatus.Open]: "Abierto",
  [JobStatus.Funded]: "Fondeado",
  [JobStatus.Submitted]: "Entregado",
  [JobStatus.Completed]: "Completado",
  [JobStatus.Rejected]: "Rechazado",
  [JobStatus.Expired]: "Expirado",
};

// Forma del struct Job que devuelve getJob(jobId).
export type Job = {
  client: `0x${string}`;
  provider: `0x${string}`;
  evaluator: `0x${string}`;
  budget: bigint;
  expiresAt: bigint;
  status: JobStatus;
  deliverableRef: `0x${string}`;
};
