import { ConnectButton } from "@rainbow-me/rainbowkit";

export type NavTarget = "board" | "create" | "multisig";

type Props = {
  active: string;
  onNavigate: (target: NavTarget) => void;
};

const NAV: { id: NavTarget; label: string }[] = [
  { id: "board", label: "Tablero" },
  { id: "create", label: "Publicar" },
  { id: "multisig", label: "Multisig" },
];

export function Header({ active, onNavigate }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">⬡</span>
        <div>
          <h1>JOB MARKETPLACE</h1>
          <p className="brand-sub">escrow ERC-20 · Sepolia</p>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`btn ${active === item.id ? "primary" : "ghost"}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <ConnectButton />
    </header>
  );
}
