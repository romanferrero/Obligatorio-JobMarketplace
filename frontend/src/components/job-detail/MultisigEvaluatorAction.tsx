import { useState } from "react";
import { useProposeJobAction } from "@/hooks/useProposeJobAction";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";
import { JobStatus } from "@/config";

type Props = {
  jobId: bigint;
  status: JobStatus;
};

export function MultisigEvaluatorAction({ jobId, status }: Props) {
  const [reason, setReason] = useState("");
  const { proposeComplete, proposeReject, status: txStatus, errorMessage } = useProposeJobAction();
  const pending = txStatus === "pending" || txStatus === "confirming";

  return (
    <div className="card action-card">
      <h4>Evaluador: Multisig</h4>
      <p className="muted small">
        El evaluador de este trabajo es el Multisig. Para que se ejecute de verdad hacen falta M de
        N firmantes aprobando y alguien ejecutando desde la pestaña Multisig.
      </p>
      <label>
        Motivo (opcional)
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" />
      </label>
      <div className="proposal-actions">
        {status === JobStatus.Submitted && (
          <Button variant="primary" pending={pending} onClick={() => void proposeComplete(jobId, reason)}>
            Proponer Aprobar
          </Button>
        )}
        <Button variant="danger" pending={pending} onClick={() => void proposeReject(jobId, reason)}>
          Proponer Rechazar
        </Button>
      </div>
      <TxStatus
        status={txStatus}
        errorMessage={errorMessage}
        successLabel="Propuesta creada. Ve a la pestaña Multisig para aprobar y ejecutar."
      />
    </div>
  );
}
