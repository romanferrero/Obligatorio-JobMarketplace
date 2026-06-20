import { JOB_STATUS_LABEL, type JobStatus } from "@/config";

type Props = {
  status: JobStatus;
};

export function StatusBadge({ status }: Props) {
  return <span className={`status-badge s${status}`}>{JOB_STATUS_LABEL[status]}</span>;
}
