import { useState } from "react";
import { isAddress, isHex, parseEther } from "viem";
import { useProposeTx } from "@/hooks/useProposeTx";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

export function NewProposalForm() {
  const [to, setTo] = useState("");
  const [valueEth, setValueEth] = useState("");
  const [data, setData] = useState("");
  const { propose, status, errorMessage } = useProposeTx();

  const toValid = isAddress(to);
  const dataValue = data.trim() === "" ? "0x" : data.trim();
  const dataValid = isHex(dataValue);
  const pending = status === "pending" || status === "confirming";

  const submit = () => {
    if (!toValid || !dataValid) return;
    const value = valueEth ? parseEther(valueEth) : 0n;
    void propose(to as `0x${string}`, value, dataValue as `0x${string}`);
  };

  return (
    <div className="card">
      <h3>Nueva Propuesta</h3>
      <label>
        Dirección destino
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
      </label>
      <label>
        Valor (ETH)
        <input
          value={valueEth}
          onChange={(e) => setValueEth(e.target.value)}
          placeholder="0.0"
          inputMode="decimal"
        />
      </label>
      <label>
        Calldata (hex, opcional)
        <input value={data} onChange={(e) => setData(e.target.value)} placeholder="0x" />
      </label>
      <Button
        variant="primary"
        className="block"
        disabled={!toValid || !dataValid}
        pending={pending}
        onClick={submit}
      >
        Enviar Propuesta
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Propuesta creada." />
    </div>
  );
}
