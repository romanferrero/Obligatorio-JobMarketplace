import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";

export function useMultisigInfo() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: qk.multisigInfo(),
    queryFn: async () => {
      if (!publicClient) throw new Error("Sin conexión a la red.");
      const [signers, threshold, proposalCount] = await publicClient.multicall({
        contracts: [
          { address: ADDRESSES.multisig, abi: multisigAbi, functionName: "getSigners" },
          { address: ADDRESSES.multisig, abi: multisigAbi, functionName: "threshold" },
          { address: ADDRESSES.multisig, abi: multisigAbi, functionName: "proposalCount" },
        ],
        allowFailure: false,
      });
      return { signers: signers as readonly `0x${string}`[], threshold, proposalCount };
    },
    enabled: !!publicClient,
  });
}
