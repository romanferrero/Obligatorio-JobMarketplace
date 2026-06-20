import { useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/AppShell";
import { Header, type NavTarget } from "@/components/layout/Header";
import { ConnectGate } from "@/components/layout/ConnectGate";
import { AccountPanel } from "@/components/account/AccountPanel";
import { JobBoard } from "@/components/board/JobBoard";
import { JobDetail } from "@/components/job-detail/JobDetail";
import { CreateJobForm } from "@/components/create-job/CreateJobForm";
import { MultisigPanel } from "@/components/multisig/MultisigPanel";

type View =
  | { name: "board" }
  | { name: "detail"; jobId: bigint }
  | { name: "create" }
  | { name: "multisig" };

export default function App() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<View>({ name: "board" });

  // Requisito de la Entrega 1: sin wallet conectada, la página entera no debe
  // mostrar nada más que el botón de conexión (ni header, ni nav, ni panels).
  if (!isConnected) {
    return <ConnectGate />;
  }

  const navigate = (target: NavTarget) => {
    if (target === "board") setView({ name: "board" });
    else if (target === "create") setView({ name: "create" });
    else setView({ name: "multisig" });
  };

  return (
    <AppShell header={<Header active={view.name} onNavigate={navigate} />}>
      <AccountPanel />
      {view.name === "board" && (
        <JobBoard
          onSelectJob={(jobId) => setView({ name: "detail", jobId })}
          onCreateJob={() => setView({ name: "create" })}
        />
      )}
      {view.name === "detail" && (
        <JobDetail jobId={view.jobId} onBack={() => setView({ name: "board" })} />
      )}
      {view.name === "create" && <CreateJobForm onCreated={() => setView({ name: "board" })} />}
      {view.name === "multisig" && <MultisigPanel />}
    </AppShell>
  );
}
