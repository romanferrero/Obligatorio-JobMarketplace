import { useQueryClient } from "@tanstack/react-query";
import { multisigAbi } from "@/abi";
import { ADDRESSES } from "@/config";
import { qk } from "@/lib/queryKeys";
import { useContractWrite } from "@/hooks/useContractWrite";

export function useExecuteProposal() {
  const queryClient = useQueryClient();
  const { write, status, errorMessage, reset } = useContractWrite({
    address: ADDRESSES.multisig,
    abi: multisigAbi,
    functionName: "execute",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.proposals() });
      // Una propuesta ejecutada puede ser un complete/reject de algún job
      // (cuando el evaluador es este Multisig); no sabemos cuál sin decodificar
      // el calldata, así que invalidamos todo lo de "jobs" para no mostrar
      // estado viejo en el Tablero/Detalle.
      void queryClient.invalidateQueries({ queryKey: qk.jobsAll() });
    },
  });

  const executeProposal = (proposalId: bigint) => write([proposalId]);

  return { executeProposal, status, errorMessage, reset };
}
