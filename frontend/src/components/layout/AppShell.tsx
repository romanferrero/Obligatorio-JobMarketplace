import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export function AppShell({ header, children }: Props) {
  return (
    <div className="page">
      {header}
      {children}
    </div>
  );
}
