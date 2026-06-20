import { useQueryClient } from "@tanstack/react-query";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useCancelProposal() {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.multisig,
    abi: multisigAbi,
    functionName: "cancel",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.proposals() }),
  });

  const cancelProposal = (proposalId: bigint) => write([proposalId]);

  return { cancelProposal, status, errorMessage, reset };
}
