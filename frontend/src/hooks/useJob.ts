import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES, type Job } from "@/config";
import { qk } from "@/lib/queryKeys";

export function useJob(jobId: bigint | undefined) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: qk.job(jobId ?? 0n),
    queryFn: async (): Promise<Job> => {
      if (!publicClient || jobId === undefined) {
        throw new Error("Trabajo no especificado.");
      }
      return await publicClient.readContract({
        address: ADDRESSES.jobMarketplace,
        abi: jobMarketplaceAbi,
        functionName: "getJob",
        args: [jobId],
      });
    },
    enabled: !!publicClient && jobId !== undefined,
  });
}
