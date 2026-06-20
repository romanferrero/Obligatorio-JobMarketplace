import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "Job Marketplace",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "job-marketplace-dev",
  chains: [sepolia],
  transports: {
    [sepolia.id]: rpcUrl ? http(rpcUrl) : http(),
  },
  ssr: false,
});
