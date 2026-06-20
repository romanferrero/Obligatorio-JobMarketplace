import { zeroHash } from "viem";
import { getDeliverable } from "@/lib/deliverableStorage";

type Props = {
  deliverableRef: `0x${string}`;
};

export function DeliverableViewer({ deliverableRef }: Props) {
  if (deliverableRef === zeroHash) return null;

  const content = getDeliverable(deliverableRef);

  return (
    <div className="card action-card">
      <h4>Entrega</h4>
      {content ? (
        <p>{content}</p>
      ) : (
        <p className="muted small">
          No se encontró el contenido en este navegador (el proveedor lo guardó en el suyo). Hash:{" "}
          <span className="mono">{deliverableRef}</span>
        </p>
      )}
    </div>
  );
}
