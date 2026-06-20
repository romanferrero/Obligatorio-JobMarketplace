import { formatUnits } from "viem";

export function formatAddress(address: string | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatEth(wei: bigint | undefined): string {
  if (wei === undefined) return "—";
  return Number(formatUnits(wei, 18)).toFixed(4);
}

export function formatTokenAmount(
  value: bigint | undefined,
  decimals: number | undefined,
  symbol?: string,
): string {
  if (value === undefined || decimals === undefined) return "—";
  const formatted = formatUnits(value, decimals);
  const trimmed = Number(formatted).toLocaleString("es-UY", {
    maximumFractionDigits: 6,
  });
  return symbol ? `${trimmed} ${symbol}` : trimmed;
}

export function formatExpiry(expiresAt: bigint): string {
  const date = new Date(Number(expiresAt) * 1000);
  return date.toLocaleString("es-UY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toUnixTimestamp(datetimeLocalValue: string): bigint {
  const ms = new Date(datetimeLocalValue).getTime();
  return BigInt(Math.floor(ms / 1000));
}
