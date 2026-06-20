import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES, DEPLOY_BLOCK } from "@/config";
import { qk } from "@/lib/queryKeys";

export type JobListRow = {
  jobId: bigint;
  client: `0x${string}`;
  evaluator: `0x${string}`;
  provider: `0x${string}`;
  budget: bigint;
  expiresAt: bigint;
  description: string;
  blockNumber: bigint;
};

export function useJobsList() {
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.jobsList(),
    queryFn: async (): Promise<JobListRow[]> => {
      if (!publicClient) throw new Error("Sin conexión a la red.");

      const logs = await publicClient.getContractEvents({
        address: ADDRESSES.jobMarketplace,
        abi: jobMarketplaceAbi,
        eventName: "JobCreated",
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      });

      const byJobId = new Map<bigint, JobListRow>();
      for (const log of logs) {
        const { args, blockNumber } = log;
        if (
          args.jobId === undefined ||
          args.client === undefined ||
          args.evaluator === undefined ||
          args.provider === undefined ||
          args.budget === undefined ||
          args.expiresAt === undefined ||
          args.description === undefined ||
          blockNumber === null
        ) {
          continue;
        }
        byJobId.set(args.jobId, {
          jobId: args.jobId,
          client: args.client,
          evaluator: args.evaluator,
          provider: args.provider,
          budget: args.budget,
          expiresAt: args.expiresAt,
          description: args.description,
          blockNumber,
        });
      }

      return Array.from(byJobId.values()).sort((a, b) => (b.jobId > a.jobId ? 1 : -1));
    },
    enabled: !!publicClient,
  });

  // Cuando entra un job nuevo, invalidamos en vez de hacer splicing manual del
  // cache: para el volumen de un proyecto de curso es más simple y suficiente.
  useWatchContractEvent({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    eventName: "JobCreated",
    onLogs: () => {
      void queryClient.invalidateQueries({ queryKey: qk.jobsList() });
    },
  });

  return query;
}
