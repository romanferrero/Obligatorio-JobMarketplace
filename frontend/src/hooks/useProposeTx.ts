import { useQueryClient } from "@tanstack/react-query";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useProposeTx() {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.multisig,
    abi: multisigAbi,
    functionName: "propose",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.proposals() });
      void queryClient.invalidateQueries({ queryKey: qk.multisigInfo() });
    },
  });

  const propose = (to: `0x${string}`, value: bigint, data: `0x${string}`) => write([to, value, data]);

  return { propose, status, errorMessage, reset };
}
