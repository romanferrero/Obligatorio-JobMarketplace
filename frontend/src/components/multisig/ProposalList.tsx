import { useProposals } from "@/hooks/useProposals";
import { useMultisigInfo } from "@/hooks/useMultisigInfo";
import { useIsMultisigSigner } from "@/hooks/useIsMultisigSigner";
import { ProposalCard } from "@/components/multisig/ProposalCard";

export function ProposalList() {
  const { data: proposals, isLoading } = useProposals();
  const { data: info } = useMultisigInfo();
  const { data: isSigner } = useIsMultisigSigner();

  if (isLoading || !info) {
    return <p className="empty-state">Cargando propuestas…</p>;
  }
  if (proposals && proposals.length === 0) {
    return <p className="empty-state">Todavía no hay propuestas.</p>;
  }

  return (
    <div className="proposals">
      {proposals?.map((proposal) => (
        <ProposalCard
          key={proposal.id.toString()}
          proposal={proposal}
          threshold={info.threshold}
          isSigner={!!isSigner}
        />
      ))}
    </div>
  );
}
