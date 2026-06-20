import { ConnectButton } from "@rainbow-me/rainbowkit";

// Requisito explícito de la Entrega 1: sin wallet conectada, la página no debe
// mostrar nada más que un botón de conexión destacado.
export function ConnectGate() {
  return (
    <div className="connect-gate">
      <ConnectButton />
    </div>
  );
}
