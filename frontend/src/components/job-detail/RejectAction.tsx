import { useState } from "react";
import { useRejectJob } from "@/hooks/useRejectJob";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

type Props = {
  jobId: bigint;
};

export function RejectAction({ jobId }: Props) {
  const [reason, setReason] = useState("");
  const { reject, status, errorMessage } = useRejectJob(jobId);
  const pending = status === "pending" || status === "confirming";

  return (
    <div className="card action-card">
      <h4>Rechazar</h4>
      <label>
        Motivo (opcional)
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del rechazo" />
      </label>
      <Button variant="danger" className="block" pending={pending} onClick={() => void reject(reason)}>
        Rechazar
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Trabajo rechazado." />
    </div>
  );
}
