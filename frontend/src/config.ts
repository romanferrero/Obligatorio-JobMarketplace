// Direcciones de los contratos y datos de red.
// Completar las direcciones después del deploy a Sepolia (salen del output de
// `npx hardhat run scripts/deploy.js --network sepolia`).

export const SEPOLIA_CHAIN_ID = 11155111;

export const ADDRESSES = {
  jobMarketplace: "0x0000000000000000000000000000000000000000",
  multisig: "0x0000000000000000000000000000000000000000",
  mockErc20: "0x0000000000000000000000000000000000000000",
} as const;

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
