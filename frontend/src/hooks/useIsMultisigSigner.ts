import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";

export function useIsMultisigSigner() {
  const publicClient = usePublicClient();
  const { address: account } = useAccount();

  return useQuery({
    queryKey: qk.isMultisigSigner(account),
    queryFn: async (): Promise<boolean> => {
      if (!publicClient || !account) return false;
      return publicClient.readContract({
        address: ADDRESSES.multisig,
        abi: multisigAbi,
        functionName: "isSigner",
        args: [account],
      });
    },
    enabled: !!publicClient && !!account,
  });
}
