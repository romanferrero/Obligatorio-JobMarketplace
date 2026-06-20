import { useAccount } from "wagmi";
import type { ProposalRow } from "@/hooks/useProposals";
import { useApproveProposal } from "@/hooks/useApproveProposal";
import { useExecuteProposal } from "@/hooks/useExecuteProposal";
import { useCancelProposal } from "@/hooks/useCancelProposal";
import { AddressText } from "@/components/shared/AddressText";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";
import { formatEth } from "@/lib/format";

const STATUS_LABEL = ["Pendiente", "Ejecutada", "Cancelada"];

type Props = {
  proposal: ProposalRow;
  threshold: bigint;
  isSigner: boolean;
};

export function ProposalCard({ proposal, threshold, isSigner }: Props) {
  const { address } = useAccount();
  const approve = useApproveProposal();
  const execute = useExecuteProposal();
  const cancel = useCancelProposal();

  const reached = proposal.approvals >= threshold;
  const isPending = proposal.status === 0;
  const isProposer = address?.toLowerCase() === proposal.proposer.toLowerCase();

  return (
    <article className="card proposal">
      <div className="job-card-top">
        <span className="job-card-id mono">#{proposal.id.toString()}</span>
        <span className={`status-badge ms${proposal.status}`}>{STATUS_LABEL[proposal.status]}</span>
      </div>
      <div className="detail-fields">
        <dl>
          <dt>Destino</dt>
          <dd>
            <AddressText address={proposal.to} />
          </dd>
          <dt>Valor</dt>
          <dd className="mono">{formatEth(proposal.value)} ETH</dd>
          <dt>Proponente</dt>
          <dd>
            <AddressText address={proposal.proposer} />
          </dd>
          <dt>Aprobaciones</dt>
          <dd className="mono">
            {proposal.approvals.toString()} / {threshold.toString()}
          </dd>
        </dl>
      </div>
      {isPending && isSigner && (
        <div className="proposal-actions">
          <Button
            disabled={proposal.approvedByMe}
            pending={approve.status === "pending" || approve.status === "confirming"}
            onClick={() => void approve.approveProposal(proposal.id)}
          >
            {proposal.approvedByMe ? "Aprobada ✓" : "Aprobar"}
          </Button>
          <Button
            variant="primary"
            disabled={!reached}
            pending={execute.status === "pending" || execute.status === "confirming"}
            onClick={() => void execute.executeProposal(proposal.id)}
          >
            Ejecutar
          </Button>
          {isProposer && (
            <Button
              variant="danger"
              pending={cancel.status === "pending" || cancel.status === "confirming"}
              onClick={() => void cancel.cancelProposal(proposal.id)}
            >
              Cancelar
            </Button>
          )}
        </div>
      )}
      <TxStatus status={approve.status} errorMessage={approve.errorMessage} successLabel="Aprobado." />
      <TxStatus status={execute.status} errorMessage={execute.errorMessage} successLabel="Ejecutado." />
      <TxStatus status={cancel.status} errorMessage={cancel.errorMessage} successLabel="Cancelado." />
    </article>
  );
}
