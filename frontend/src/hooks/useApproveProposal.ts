import { useQueryClient } from "@tanstack/react-query";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useApproveProposal() {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.multisig,
    abi: multisigAbi,
    functionName: "approve",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.proposals() }),
  });

  const approveProposal = (proposalId: bigint) => write([proposalId]);

  return { approveProposal, status, errorMessage, reset };
}
