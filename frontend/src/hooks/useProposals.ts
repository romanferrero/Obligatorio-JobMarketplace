import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";

export type ProposalRow = {
  id: bigint;
  proposer: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  approvals: bigint;
  status: number;
  approvedByMe: boolean;
};

export function useProposals() {
  const publicClient = usePublicClient();
  const { address: account } = useAccount();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.proposals(),
    queryFn: async (): Promise<ProposalRow[]> => {
      if (!publicClient) throw new Error("Sin conexión a la red.");

      const count = await publicClient.readContract({
        address: ADDRESSES.multisig,
        abi: multisigAbi,
        functionName: "proposalCount",
      });

      const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
      const rows = await Promise.all(
        ids.map(async (id) => {
          const [proposer, to, value, data, approvals, status] = await publicClient.readContract({
            address: ADDRESSES.multisig,
            abi: multisigAbi,
            functionName: "getProposal",
            args: [id],
          });
          const approvedByMe = account
            ? await publicClient.readContract({
                address: ADDRESSES.multisig,
                abi: multisigAbi,
                functionName: "hasApproved",
                args: [id, account],
              })
            : false;
          return { id, proposer, to, value, data, approvals, status, approvedByMe };
        }),
      );

      return rows.reverse();
    },
    enabled: !!publicClient,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: qk.proposals() });
  useWatchContractEvent({ address: ADDRESSES.multisig, abi: multisigAbi, eventName: "ProposalCreated", onLogs: invalidate });
  useWatchContractEvent({ address: ADDRESSES.multisig, abi: multisigAbi, eventName: "Approved", onLogs: invalidate });
  useWatchContractEvent({ address: ADDRESSES.multisig, abi: multisigAbi, eventName: "Executed", onLogs: invalidate });
  useWatchContractEvent({ address: ADDRESSES.multisig, abi: multisigAbi, eventName: "Cancelled", onLogs: invalidate });

  return query;
}
