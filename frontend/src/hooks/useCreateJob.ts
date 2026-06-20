import { useQueryClient } from "@tanstack/react-query";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

type CreateJobParams = {
  description: string;
  budget: bigint;
  evaluator: `0x${string}`;
  provider: `0x${string}`;
  expiresAt: bigint;
};

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    functionName: "createJob",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.jobsList() }),
  });

  const createJob = (params: CreateJobParams) =>
    write([params.description, params.budget, params.evaluator, params.provider, params.expiresAt]);

  return { createJob, status, errorMessage, reset };
}
