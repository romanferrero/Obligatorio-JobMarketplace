import { useFundJob } from "@/hooks/useFundJob";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";
import { ESCROW_TOKEN_DECIMALS } from "@/config";
import { formatTokenAmount } from "@/lib/format";

type Props = {
  jobId: bigint;
  budget: bigint;
};

const STEP_LABEL: Record<string, string> = {
  checking: "Revisando allowance…",
  approving: "Aprobando el gasto del token…",
  funding: "Fondeando el trabajo…",
};

export function FundAction({ jobId, budget }: Props) {
  const { fund, step, status, errorMessage } = useFundJob(jobId, budget);
  const pending = step === "checking" || step === "approving" || step === "funding";

  return (
    <div className="card action-card">
      <h4>Fondear Trabajo</h4>
      <p className="muted small">
        Budget a transferir al escrow: {formatTokenAmount(budget, ESCROW_TOKEN_DECIMALS)}
      </p>
      <Button variant="primary" className="block" pending={pending} onClick={() => void fund()}>
        Fondear
      </Button>
      {pending && <p className="muted small">{STEP_LABEL[step]}</p>}
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Trabajo fondeado." />
    </div>
  );
}
