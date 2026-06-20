import { useMultisigInfo } from "@/hooks/useMultisigInfo";
import { AddressText } from "@/components/shared/AddressText";
import { ADDRESSES } from "@/config";

export function MultisigInfoCard() {
  const { data, isLoading } = useMultisigInfo();

  if (isLoading || !data) {
    return <div className="card">Cargando información del Multisig…</div>;
  }

  return (
    <div className="card detail-fields">
      <h3>Información del contrato</h3>
      <dl>
        <dt>Dirección</dt>
        <dd className="mono">
          <AddressText address={ADDRESSES.multisig} />
        </dd>
        <dt>Threshold</dt>
        <dd>
          <span className="pill">{data.threshold.toString()}</span> de {data.signers.length}
        </dd>
        <dt>Signers</dt>
        <dd className="signer-list">
          {data.signers.map((signer) => (
            <AddressText key={signer} address={signer} />
          ))}
        </dd>
      </dl>
    </div>
  );
}
