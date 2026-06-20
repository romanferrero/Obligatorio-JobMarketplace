import { useAccount, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { formatAddress } from "@/lib/format";

// ENS solo existe en mainnet, no en Sepolia, así que la resolución apunta a
// mainnet explícitamente aunque la app opere en testnet. Para la mayoría de las
// wallets de prueba esto no va a resolver nombre y se cae al address abreviada,
// que es exactamente el comportamiento que pide la consigna ("ENS si está
// disponible, sino dirección abreviada").
export function useEnsOrAddress() {
  const { address } = useAccount();
  const { data: ensName, isLoading } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: !!address },
  });

  return {
    address,
    display: ensName ?? formatAddress(address),
    isLoading,
  };
}
