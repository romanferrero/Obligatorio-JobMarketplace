import { useCallback, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { jobMarketplaceAbi, mockErc20Abi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export type FundStep = "idle" | "checking" | "approving" | "funding" | "done";

export function useFundJob(jobId: bigint, budget: bigint) {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<FundStep>("idle");

  const approveWrite = useContractWrite({
    address: ADDRESSES.mockErc20,
    abi: mockErc20Abi,
    functionName: "approve",
  });

  const fundWrite = useContractWrite({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    functionName: "fund",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.job(jobId) });
      if (account) {
        void queryClient.invalidateQueries({
          queryKey: qk.tokenBalance(ADDRESSES.mockErc20, account),
        });
      }
    },
  });

  const fund = useCallback(async () => {
    if (!publicClient || !account) return;

    setStep("checking");
    // Lectura sin cache: un allowance viejo de un job anterior no debe colarse acá.
    const allowance = await publicClient.readContract({
      address: ADDRESSES.mockErc20,
      abi: mockErc20Abi,
      functionName: "allowance",
      args: [account, ADDRESSES.jobMarketplace],
    });

    if (allowance < budget) {
      setStep("approving");
      const approved = await approveWrite.write([ADDRESSES.jobMarketplace, budget]);
      if (!approved) {
        setStep("idle");
        return;
      }
    }

    setStep("funding");
    await fundWrite.write([jobId]);
    setStep("done");
  }, [publicClient, account, budget, jobId, approveWrite, fundWrite]);

  const status = approveWrite.status === "error" ? "error" : fundWrite.status;
  const errorMessage = approveWrite.errorMessage ?? fundWrite.errorMessage;

  return { fund, step, status, errorMessage };
}
