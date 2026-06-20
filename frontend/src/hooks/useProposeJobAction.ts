import { encodeFunctionData, keccak256, toBytes } from "viem";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { useProposeTx } from "@/hooks/useProposeTx";

// Integración Multisig <-> Job Detail: cuando el evaluador de un job es el
// Multisig, un firmante puede "proponer" el complete/reject acá mismo (en vez
// de armar el calldata a mano), generando la propuesta con propose(). Recién
// se ejecuta de verdad cuando el resto de los firmantes aprueba y alguien
// llama a execute() desde el panel de Multisig.
export function useProposeJobAction() {
  const { propose, status, errorMessage, reset } = useProposeTx();

  const proposeComplete = (jobId: bigint, reason: string) => {
    const data = encodeFunctionData({
      abi: jobMarketplaceAbi,
      functionName: "complete",
      args: [jobId, keccak256(toBytes(reason || "Aprobado"))],
    });
    return propose(ADDRESSES.jobMarketplace, 0n, data);
  };

  const proposeReject = (jobId: bigint, reason: string) => {
    const data = encodeFunctionData({
      abi: jobMarketplaceAbi,
      functionName: "reject",
      args: [jobId, keccak256(toBytes(reason || "Rechazado"))],
    });
    return propose(ADDRESSES.jobMarketplace, 0n, data);
  };

  return { proposeComplete, proposeReject, status, errorMessage, reset };
}
