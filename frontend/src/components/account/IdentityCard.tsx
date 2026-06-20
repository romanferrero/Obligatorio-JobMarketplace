import { useEnsOrAddress } from "@/hooks/useEnsOrAddress";

export function IdentityCard() {
  const { display, isLoading } = useEnsOrAddress();

  return (
    <div className="card account-card">
      <h3>Cuenta</h3>
      <p className="mono account-value">{isLoading ? "Cargando…" : display}</p>
    </div>
  );
}
