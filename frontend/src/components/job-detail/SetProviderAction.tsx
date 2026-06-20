import { useState } from "react";
import { isAddress } from "viem";
import { useSetProvider } from "@/hooks/useSetProvider";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

type Props = {
  jobId: bigint;
};

export function SetProviderAction({ jobId }: Props) {
  const [provider, setProviderInput] = useState("");
  const { setProvider, status, errorMessage } = useSetProvider(jobId);

  const valid = isAddress(provider);

  return (
    <div className="card action-card">
      <h4>Asignar Proveedor</h4>
      <label>
        Dirección del proveedor
        <input value={provider} onChange={(e) => setProviderInput(e.target.value)} placeholder="0x..." />
      </label>
      {provider.length > 0 && !valid && <p className="field-error">Dirección inválida.</p>}
      <Button
        variant="primary"
        className="block"
        disabled={!valid}
        pending={status === "pending" || status === "confirming"}
        onClick={() => void setProvider(provider as `0x${string}`)}
      >
        Asignar
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Proveedor asignado." />
    </div>
  );
}
