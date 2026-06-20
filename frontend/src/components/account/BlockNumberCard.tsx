import { useChainTime } from "@/hooks/useChainTime";

export function BlockNumberCard() {
  const { blockNumber, isLoading } = useChainTime();

  return (
    <div className="card account-card">
      <h3>Bloque actual</h3>
      <p className="mono account-value pulse">
        {isLoading || blockNumber === undefined ? "Cargando…" : blockNumber.toString()}
      </p>
    </div>
  );
}
