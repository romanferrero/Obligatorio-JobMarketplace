import { useBlock } from "wagmi";

// Única fuente de "tiempo de la chain" en vivo: alimenta tanto el número de
// bloque del Panel de Cuenta (Entrega 1) como el chequeo de expiración de
// trabajos (Entrega Final) — un solo polling, no dos.
export function useChainTime() {
  const { data: block, isLoading } = useBlock({ watch: true });

  return {
    blockNumber: block?.number,
    timestamp: block?.timestamp,
    isLoading,
  };
}
