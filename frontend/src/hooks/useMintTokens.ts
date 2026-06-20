import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { mockErc20Abi } from "@/abi";
import { ADDRESSES, ESCROW_TOKEN_DECIMALS } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

// Faucet de prueba: mintea mUSD a la wallet conectada para poder fondear trabajos
// sin tener que ir a Etherscan/consola. El mint() del MockERC20 es público a
// propósito (solo testnet).
export function useMintTokens() {
  const { address: account } = useAccount();
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.mockErc20,
    abi: mockErc20Abi,
    functionName: "mint",
    onSuccess: () => {
      if (account) {
        void queryClient.invalidateQueries({
          queryKey: qk.tokenBalance(ADDRESSES.mockErc20, account),
        });
      }
    },
  });

  const mint = (amount: string) => {
    if (!account) return Promise.resolve(false);
    return write([account, parseUnits(amount, ESCROW_TOKEN_DECIMALS)]);
  };

  return { mint, status, errorMessage, reset };
}
