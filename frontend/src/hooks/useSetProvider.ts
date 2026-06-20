import { useQueryClient } from "@tanstack/react-query";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useSetProvider(jobId: bigint) {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    functionName: "setProvider",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.job(jobId) }),
  });

  const setProvider = (provider: `0x${string}`) => write([jobId, provider]);

  return { setProvider, status, errorMessage, reset };
}
