import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { zeroAddress } from "viem";
import { ADDRESSES, JobStatus, type Job } from "@/config";
import { useJobRole } from "@/hooks/useJobRole";
import { useChainTime } from "@/hooks/useChainTime";
import { useIsMultisigSigner } from "@/hooks/useIsMultisigSigner";
import { SetProviderAction } from "@/components/job-detail/SetProviderAction";
import { FundAction } from "@/components/job-detail/FundAction";
import { RejectAction } from "@/components/job-detail/RejectAction";
import { SubmitDeliverableAction } from "@/components/job-detail/SubmitDeliverableAction";
import { CompleteAction } from "@/components/job-detail/CompleteAction";
import { ClaimRefundAction } from "@/components/job-detail/ClaimRefundAction";
import { MultisigEvaluatorAction } from "@/components/job-detail/MultisigEvaluatorAction";

type Props = {
  jobId: bigint;
  job: Job;
};

export function ActionPanel({ jobId, job }: Props) {
  const { address: connectedAddress } = useAccount();
  const { timestamp } = useChainTime();
  const { isClient, isProvider, isEvaluator, isExpired } = useJobRole(job, connectedAddress, timestamp);
  const { data: isMultisigSigner } = useIsMultisigSigner();

  const isEvaluatorMultisig = job.evaluator.toLowerCase() === ADDRESSES.multisig.toLowerCase();
  const showMultisigAction =
    isEvaluatorMultisig &&
    !!isMultisigSigner &&
    (job.status === JobStatus.Funded || job.status === JobStatus.Submitted);

  const actions: { key: string; node: ReactNode }[] = [];

  if (isClient && job.status === JobStatus.Open) {
    if (job.provider === zeroAddress) {
      actions.push({ key: "set-provider", node: <SetProviderAction jobId={jobId} /> });
    } else {
      actions.push({ key: "fund", node: <FundAction jobId={jobId} budget={job.budget} /> });
    }
    actions.push({ key: "reject-client", node: <RejectAction jobId={jobId} /> });
  }

  if (isProvider && job.status === JobStatus.Funded) {
    actions.push({ key: "submit", node: <SubmitDeliverableAction jobId={jobId} /> });
  }

  if (isEvaluator && job.status === JobStatus.Submitted) {
    actions.push({
      key: "complete",
      node: <CompleteAction jobId={jobId} deliverableRef={job.deliverableRef} />,
    });
  }

  if (isEvaluator && (job.status === JobStatus.Funded || job.status === JobStatus.Submitted)) {
    actions.push({ key: "reject-evaluator", node: <RejectAction jobId={jobId} /> });
  }

  if (showMultisigAction) {
    actions.push({
      key: "multisig-eval",
      node: <MultisigEvaluatorAction jobId={jobId} status={job.status} />,
    });
  }

  if (isExpired) {
    actions.push({ key: "claim-refund", node: <ClaimRefundAction jobId={jobId} /> });
  }

  if (actions.length === 0) {
    return <p className="empty-state">No tenés acciones disponibles para este trabajo.</p>;
  }

  return (
    <div className="action-panel">
      {actions.map((action) => (
        <div key={action.key}>{action.node}</div>
      ))}
    </div>
  );
}
