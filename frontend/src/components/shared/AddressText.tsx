import { formatAddress } from "@/lib/format";

type Props = {
  address: string;
};

export function AddressText({ address }: Props) {
  const copy = () => {
    void navigator.clipboard.writeText(address);
  };

  return (
    <span className="mono address-text" title={`${address} (clic para copiar)`} onClick={copy}>
      {formatAddress(address)}
    </span>
  );
}
