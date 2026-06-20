import { Banner } from "@/components/shared/Banner";
import type { WriteStatus } from "@/hooks/useContractWrite";

type Props = {
  status: WriteStatus;
  errorMessage: string | null;
  successLabel?: string;
};

export function TxStatus({ status, errorMessage, successLabel = "Confirmado." }: Props) {
  if (status === "idle") return null;
  if (status === "pending") {
    return <Banner variant="info">Esperando confirmación en la wallet…</Banner>;
  }
  if (status === "confirming") {
    return <Banner variant="info">Esperando que se mine la transacción…</Banner>;
  }
  if (status === "success") {
    return <Banner variant="success">{successLabel}</Banner>;
  }
  return <Banner variant="error">{errorMessage ?? "Ocurrió un error."}</Banner>;
}
