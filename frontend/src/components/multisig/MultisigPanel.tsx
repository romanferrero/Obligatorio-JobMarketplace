import { useIsMultisigSigner } from "@/hooks/useIsMultisigSigner";
import { MultisigInfoCard } from "@/components/multisig/MultisigInfoCard";
import { NewProposalForm } from "@/components/multisig/NewProposalForm";
import { ProposalList } from "@/components/multisig/ProposalList";
import { Banner } from "@/components/shared/Banner";

export function MultisigPanel() {
  const { data: isSigner } = useIsMultisigSigner();

  return (
    <section>
      <h2 className="section-title">Multisig</h2>
      {isSigner === false && (
        <Banner variant="info">
          Estás conectado pero no sos firmante de este Multisig. Podés ver el estado, pero no
          proponer, aprobar ni ejecutar.
        </Banner>
      )}
      <div className="detail-grid">
        <MultisigInfoCard />
        {isSigner && <NewProposalForm />}
      </div>
      <h3 className="section-title">Propuestas</h3>
      <ProposalList />
    </section>
  );
}
