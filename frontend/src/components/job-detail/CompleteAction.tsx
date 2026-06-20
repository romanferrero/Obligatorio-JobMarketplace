import { useState } from "react";
import { useCompleteJob } from "@/hooks/useCompleteJob";
import { DeliverableViewer } from "@/components/job-detail/DeliverableViewer";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

type Props = {
  jobId: bigint;
  deliverableRef: `0x${string}`;
};

export function CompleteAction({ jobId, deliverableRef }: Props) {
  const [reason, setReason] = useState("");
  const { complete, status, errorMessage } = useCompleteJob(jobId);
  const pending = status === "pending" || status === "confirming";

  return (
    <>
      <DeliverableViewer deliverableRef={deliverableRef} />
      <div className="card action-card">
        <h4>Aprobar</h4>
        <label>
          Motivo (opcional)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la aprobación" />
        </label>
        <Button variant="primary" className="block" pending={pending} onClick={() => void complete(reason)}>
          Aprobar y pagar al proveedor
        </Button>
        <TxStatus status={status} errorMessage={errorMessage} successLabel="Trabajo completado, pago liberado." />
      </div>
    </>
  );
}
