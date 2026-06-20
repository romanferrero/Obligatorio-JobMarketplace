import { keccak256, toBytes } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { jobMarketplaceAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { saveDeliverable } from "@/lib/deliverableStorage";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useSubmitDeliverable(jobId: bigint) {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.jobMarketplace,
    abi: jobMarketplaceAbi,
    functionName: "submit",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.job(jobId) }),
  });

  // Guarda el contenido en localStorage ANTES de mandar la tx, para no perderlo
  // si el usuario cierra la pestaña a mitad de camino.
  const submitDeliverable = (content: string) => {
    const deliverableRef = keccak256(toBytes(content));
    saveDeliverable(deliverableRef, content);
    return write([jobId, deliverableRef]);
  };

  return { submitDeliverable, status, errorMessage, reset };
}
