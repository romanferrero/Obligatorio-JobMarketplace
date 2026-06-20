import { useClaimRefund } from "@/hooks/useClaimRefund";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

type Props = {
  jobId: bigint;
};

export function ClaimRefundAction({ jobId }: Props) {
  const { claimRefund, status, errorMessage } = useClaimRefund(jobId);
  const pending = status === "pending" || status === "confirming";

  return (
    <div className="card action-card">
      <h4>Reclamar Reembolso</h4>
      <p className="muted small">Este trabajo venció sin completarse. Cualquiera puede reclamar el reembolso al cliente.</p>
      <Button variant="primary" className="block" pending={pending} onClick={() => void claimRefund()}>
        Reclamar Reembolso
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Reembolso reclamado." />
    </div>
  );
}
