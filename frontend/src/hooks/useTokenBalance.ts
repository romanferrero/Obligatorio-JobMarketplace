import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { mockErc20Abi } from "@/abi";
import { qk } from "@/lib/queryKeys";
import { POLL_INTERVAL_MS } from "@/config";

// Genérico: se usa dos veces en el Panel de Cuenta (MockERC20 + LINK), uno por
// dirección de token. Usa multicall para resolver name/symbol/decimals/balanceOf
// en un solo round-trip de RPC.
export function useTokenBalance(tokenAddress: `0x${string}`) {
  const publicClient = usePublicClient();
  const { address: account } = useAccount();

  return useQuery({
    queryKey: qk.tokenBalance(tokenAddress, account),
    queryFn: async () => {
      if (!publicClient || !account) {
        throw new Error("Wallet no conectada.");
      }
      const [name, symbol, decimals, balance] = await publicClient.multicall({
        contracts: [
          { address: tokenAddress, abi: mockErc20Abi, functionName: "name" },
          { address: tokenAddress, abi: mockErc20Abi, functionName: "symbol" },
          { address: tokenAddress, abi: mockErc20Abi, functionName: "decimals" },
          { address: tokenAddress, abi: mockErc20Abi, functionName: "balanceOf", args: [account] },
        ],
        allowFailure: false,
      });
      return { name, symbol, decimals, balance };
    },
    enabled: !!publicClient && !!account,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
