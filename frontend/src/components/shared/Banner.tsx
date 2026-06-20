import type { ReactNode } from "react";

type Variant = "info" | "warn" | "error" | "success";

type Props = {
  variant: Variant;
  children: ReactNode;
};

export function Banner({ variant, children }: Props) {
  return <div className={`banner ${variant}`}>{children}</div>;
}
