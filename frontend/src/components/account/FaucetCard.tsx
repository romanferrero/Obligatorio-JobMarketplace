import { useMintTokens } from "@/hooks/useMintTokens";
import { Button } from "@/components/shared/Button";
import { TxStatus } from "@/components/shared/TxStatus";

const FAUCET_AMOUNT = "1000";

export function FaucetCard() {
  const { mint, status, errorMessage } = useMintTokens();
  const pending = status === "pending" || status === "confirming";

  return (
    <div className="card account-card">
      <h3>Faucet mUSD</h3>
      <p className="muted small">Conseguí {FAUCET_AMOUNT} mUSD de prueba para fondear trabajos.</p>
      <Button
        variant="primary"
        className="block"
        pending={pending}
        onClick={() => void mint(FAUCET_AMOUNT)}
      >
        Conseguir mUSD
      </Button>
      <TxStatus status={status} errorMessage={errorMessage} successLabel="Tokens minteados." />
    </div>
  );
}
