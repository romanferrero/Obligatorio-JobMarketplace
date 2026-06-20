import { keccak256, toBytes } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useCompleteJob(jobId: bigint) {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    functionName: "complete",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.job(jobId) }),
  });

  const complete = (reason: string) => write([jobId, keccak256(toBytes(reason || "Aprobado"))]);

  return { complete, status, errorMessage, reset };
}
