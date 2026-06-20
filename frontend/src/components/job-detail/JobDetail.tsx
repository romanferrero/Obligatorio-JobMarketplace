import { useJob } from "@/hooks/useJob";
import { JobFields } from "@/components/job-detail/JobFields";
import { ActionPanel } from "@/components/job-detail/ActionPanel";
import { Button } from "@/components/shared/Button";

type Props = {
  jobId: bigint;
  onBack: () => void;
};

export function JobDetail({ jobId, onBack }: Props) {
  const { data: job, isLoading, isError } = useJob(jobId);

  return (
    <section>
      <div className="board-header">
        <h2 className="section-title">Detalle de Trabajo</h2>
        <Button onClick={onBack}>← Volver al Tablero</Button>
      </div>
      {isLoading && <p className="empty-state">Cargando trabajo…</p>}
      {isError && <p className="empty-state">No se encontró el trabajo.</p>}
      {job && (
        <div className="detail-grid">
          <JobFields jobId={jobId} job={job} />
          <div>
            <ActionPanel jobId={jobId} job={job} />
          </div>
        </div>
      )}
    </section>
  );
}
