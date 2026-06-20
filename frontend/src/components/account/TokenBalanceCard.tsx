import { useTokenBalance } from "@/hooks/useTokenBalance";
import { formatTokenAmount } from "@/lib/format";

type Props = {
  label: string;
  tokenAddress: `0x${string}`;
};

export function TokenBalanceCard({ label, tokenAddress }: Props) {
  const { data, isLoading, isError } = useTokenBalance(tokenAddress);

  return (
    <div className="card account-card">
      <h3>{label}</h3>
      {isLoading && <p className="account-value">Cargando…</p>}
      {isError && <p className="account-value muted">No se pudo leer el token.</p>}
      {data && (
        <>
          <p className="account-value">
            {formatTokenAmount(data.balance, data.decimals, data.symbol)}
          </p>
          <p className="muted small">
            {data.name} ({data.symbol})
          </p>
        </>
      )}
    </div>
  );
}
