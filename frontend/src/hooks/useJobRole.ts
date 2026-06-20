import { JobStatus, type Job } from "@/config";

function sameAddress(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

// Compara la wallet conectada contra los 3 roles del job (un job puede cumplir
// más de un rol a la vez, ej. cliente que se autoasignó como evaluador, así que
// estos flags no son excluyentes entre sí). isExpired usa el timestamp del
// último bloque, no el reloj del cliente (ver useChainTime).
export function useJobRole(
  job: Job | undefined,
  connectedAddress: string | undefined,
  chainTimestamp: bigint | undefined,
) {
  const isClient = sameAddress(job?.client, connectedAddress);
  const isProvider = sameAddress(job?.provider, connectedAddress);
  const isEvaluator = sameAddress(job?.evaluator, connectedAddress);

  const isExpirable =
    !!job && (job.status === JobStatus.Funded || job.status === JobStatus.Submitted);
  const isExpired = isExpirable && !!chainTimestamp && chainTimestamp > (job?.expiresAt ?? 0n);

  return { isClient, isProvider, isEvaluator, isExpired };
}
