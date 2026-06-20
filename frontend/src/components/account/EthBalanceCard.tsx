import { useAccount, useBalance } from "wagmi";
import { POLL_INTERVAL_MS } from "@/config";

export function EthBalanceCard() {
  const { address } = useAccount();
  const { data, isLoading } = useBalance({
    address,
    query: { refetchInterval: POLL_INTERVAL_MS, enabled: !!address },
  });

  const formatted = data ? Number(data.formatted).toFixed(4) : "—";

  return (
    <div className="card account-card">
      <h3>Saldo ETH</h3>
      <p className="mono account-value">{isLoading ? "Cargando…" : `${formatted} ETH`}</p>
    </div>
  );
}
