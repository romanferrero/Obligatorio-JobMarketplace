import { zeroAddress } from "viem";
import { ESCROW_TOKEN_DECIMALS, type Job } from "@/config";
import { StatusBadge } from "@/components/board/StatusBadge";
import { AddressText } from "@/components/shared/AddressText";
import { formatExpiry, formatTokenAmount } from "@/lib/format";

type Props = {
  jobId: bigint;
  job: Job;
};

export function JobFields({ jobId, job }: Props) {
  return (
    <div className="card detail-fields">
      <h3>Trabajo #{jobId.toString()}</h3>
      <dl>
        <dt>Estado</dt>
        <dd>
          <StatusBadge status={job.status} />
        </dd>
        <dt>Cliente</dt>
        <dd>
          <AddressText address={job.client} />
        </dd>
        <dt>Proveedor</dt>
        <dd>
          {job.provider === zeroAddress ? (
            <span className="muted">Sin asignar</span>
          ) : (
            <AddressText address={job.provider} />
          )}
        </dd>
        <dt>Evaluador</dt>
        <dd>
          <AddressText address={job.evaluator} />
        </dd>
        <dt>Budget</dt>
        <dd className="mono">{formatTokenAmount(job.budget, ESCROW_TOKEN_DECIMALS)}</dd>
        <dt>Expira</dt>
        <dd>{formatExpiry(job.expiresAt)}</dd>
      </dl>
    </div>
  );
}
