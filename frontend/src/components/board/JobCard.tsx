import type { JobListRow } from "@/hooks/useJobsList";
import { useJob } from "@/hooks/useJob";
import { StatusBadge } from "@/components/board/StatusBadge";
import { AddressText } from "@/components/shared/AddressText";
import { formatTokenAmount } from "@/lib/format";
import { ESCROW_TOKEN_DECIMALS } from "@/config";

type Props = {
  row: JobListRow;
  onSelect: (jobId: bigint) => void;
};

export function JobCard({ row, onSelect }: Props) {
  const { data: job } = useJob(row.jobId);

  return (
    <div className="card job-card" onClick={() => onSelect(row.jobId)}>
      <div className="job-card-top">
        <span className="job-card-id mono">#{row.jobId.toString()}</span>
        {job && <StatusBadge status={job.status} />}
      </div>
      <p className="job-card-description">{row.description}</p>
      <div className="job-card-footer">
        <span className="muted">Budget</span>
        <span className="mono">{formatTokenAmount(row.budget, ESCROW_TOKEN_DECIMALS)}</span>
      </div>
      <div className="job-card-footer">
        <span className="muted">Cliente</span>
        <AddressText address={row.client} />
      </div>
    </div>
  );
}
