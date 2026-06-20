import { useCallback, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import type { Abi } from "viem";
import { decodeError } from "@/lib/errors";

export type WriteStatus = "idle" | "pending" | "confirming" | "success" | "error";

type Options = {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  onSuccess?: () => void | Promise<void>;
};

// Hook interno compartido por todos los hooks de escritura (useCreateJob,
// useFundJob, useApproveProposal, etc.): manda la tx, espera el receipt,
// decodifica errores, y al confirmar corre el callback de éxito (cada hook
// específico decide qué query keys invalidar ahí). `write()` resuelve recién
// cuando la tx está minada, no solo enviada — así los flujos de varios pasos
// (ej. approve→fund) pueden esperar un paso antes de lanzar el siguiente.
export function useContractWrite({ address, abi, functionName, onSuccess }: Options) {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<WriteStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const write = useCallback(
    async (args: readonly unknown[]): Promise<boolean> => {
      setErrorMessage(null);
      setStatus("pending");
      try {
        const hash = await writeContractAsync({ address, abi, functionName, args });
        setStatus("confirming");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        setStatus("success");
        await onSuccess?.();
        return true;
      } catch (err) {
        setErrorMessage(decodeError(err));
        setStatus("error");
        return false;
      }
    },
    [writeContractAsync, publicClient, address, abi, functionName, onSuccess],
  );

  const reset = useCallback(() => {
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  return { write, status, errorMessage, reset };
}
