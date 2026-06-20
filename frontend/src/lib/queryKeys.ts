// Todas las lecturas de contrato pasan por useQuery + viem PublicClient con estas
// keys centralizadas (en vez de depender de las keys internas que genera wagmi),
// así la invalidación cruzada entre hooks de escritura y de lectura es explícita
// y no depende de detalles internos de wagmi.
export const qk = {
  jobsAll: () => ["jobs"] as const,
  jobsList: () => ["jobs", "list"] as const,
  job: (jobId: bigint) => ["jobs", "detail", jobId.toString()] as const,
  tokenBalance: (token: string, account: string | undefined) =>
    ["token", "balance", token.toLowerCase(), account?.toLowerCase()] as const,
  multisigInfo: () => ["multisig", "info"] as const,
  proposals: () => ["multisig", "proposals"] as const,
  isMultisigSigner: (account: string | undefined) =>
    ["multisig", "isSigner", account?.toLowerCase()] as const,
};
