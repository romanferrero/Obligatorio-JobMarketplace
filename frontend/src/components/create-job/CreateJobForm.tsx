import { useState } from "react";
import { isAddress, parseUnits, zeroAddress } from "viem";
import { useCreateJob } from "@/hooks/useCreateJob";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";
import { ESCROW_TOKEN_DECIMALS } from "@/config";
import { toUnixTimestamp } from "@/lib/format";

type Props = {
  onCreated: () => void;
};

export function CreateJobForm({ onCreated }: Props) {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [provider, setProvider] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { createJob, status, errorMessage } = useCreateJob();

  const evaluatorValid = isAddress(evaluator);
  const providerValid = provider.trim() === "" || isAddress(provider);
  const budgetValid = budget.trim() !== "" && Number(budget) > 0;
  const expiresAtValid = expiresAt !== "" && new Date(expiresAt).getTime() > Date.now();
  const formValid =
    description.trim().length > 0 && budgetValid && evaluatorValid && providerValid && expiresAtValid;
  const pending = status === "pending" || status === "confirming";

  const submit = async () => {
    if (!formValid) return;
    const ok = await createJob({
      description,
      budget: parseUnits(budget, ESCROW_TOKEN_DECIMALS),
      evaluator: evaluator as `0x${string}`,
      provider: provider.trim() !== "" ? (provider as `0x${string}`) : zeroAddress,
      expiresAt: toUnixTimestamp(expiresAt),
    });
    if (ok) onCreated();
  };

  return (
    <div className="card">
      <h3>Publicar Trabajo</h3>
      <label>
        Descripción
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Qué hay que hacer"
        />
      </label>
      <label>
        Budget
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="100" inputMode="decimal" />
      </label>
      <label>
        Evaluador (puede ser el Multisig)
        <input value={evaluator} onChange={(e) => setEvaluator(e.target.value)} placeholder="0x..." />
      </label>
      {evaluator.length > 0 && !evaluatorValid && <p className="field-error">Dirección inválida.</p>}
      <label>
        Proveedor (opcional)
        <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="0x..." />
      </label>
      {provider.length > 0 && !providerValid && <p className="field-error">Dirección inválida.</p>}
      <label>
        Expira
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
      <Button
        variant="primary"
        className="block"
        disabled={!formValid}
        pending={pending}
        onClick={() => void submit()}
      >
        Publicar Trabajo
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Trabajo publicado." />
    </div>
  );
}
