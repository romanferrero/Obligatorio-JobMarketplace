import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  pending?: boolean;
};

export function Button({
  variant = "ghost",
  pending = false,
  disabled,
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      className={`btn ${variant} ${className ?? ""}`.trim()}
      disabled={disabled || pending}
      {...rest}
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}
