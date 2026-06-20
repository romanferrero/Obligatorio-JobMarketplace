import { useState } from "react";
import { useSubmitDeliverable } from "@/hooks/useSubmitDeliverable";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

type Props = {
  jobId: bigint;
};

export function SubmitDeliverableAction({ jobId }: Props) {
  const [content, setContent] = useState("");
  const { submitDeliverable, status, errorMessage } = useSubmitDeliverable(jobId);
  const pending = status === "pending" || status === "confirming";

  return (
    <div className="card action-card">
      <h4>Enviar Entrega</h4>
      <label>
        Contenido del entregable (queda guardado en este navegador)
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Pegá o describí el resultado del trabajo"
        />
      </label>
      <Button
        variant="primary"
        className="block"
        disabled={content.trim().length === 0}
        pending={pending}
        onClick={() => void submitDeliverable(content)}
      >
        Enviar Entrega
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Entrega enviada." />
    </div>
  );
}
