import { useJobsList } from "@/hooks/useJobsList";
import { JobCard } from "@/components/board/JobCard";
import { Button } from "@/components/shared/Button";

type Props = {
  onSelectJob: (jobId: bigint) => void;
  onCreateJob: () => void;
};

export function JobBoard({ onSelectJob, onCreateJob }: Props) {
  const { data: rows, isLoading, isError } = useJobsList();

  return (
    <section>
      <div className="board-header">
        <h2 className="section-title">Tablero de Trabajos</h2>
        <Button variant="primary" onClick={onCreateJob}>
          Publicar Trabajo
        </Button>
      </div>
      {isLoading && <p className="empty-state">Cargando trabajos…</p>}
      {isError && <p className="empty-state">No se pudieron leer los trabajos.</p>}
      {rows && rows.length === 0 && (
        <p className="empty-state">Todavía no hay trabajos publicados.</p>
      )}
      <div className="board-grid">
        {rows?.map((row) => <JobCard key={row.jobId.toString()} row={row} onSelect={onSelectJob} />)}
      </div>
    </section>
  );
}
