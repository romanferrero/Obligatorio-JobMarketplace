import { IdentityCard } from "@/components/account/IdentityCard";
import { EthBalanceCard } from "@/components/account/EthBalanceCard";
import { BlockNumberCard } from "@/components/account/BlockNumberCard";
import { TokenBalanceCard } from "@/components/account/TokenBalanceCard";
import { FaucetCard } from "@/components/account/FaucetCard";
import { ADDRESSES, LINK_TOKEN_ADDRESS } from "@/config";

export function AccountPanel() {
  return (
    <section>
      <h2 className="section-title">Panel de Cuenta</h2>
      <div className="account-grid">
        <IdentityCard />
        <EthBalanceCard />
        <BlockNumberCard />
        <TokenBalanceCard label="MockERC20 (escrow)" tokenAddress={ADDRESSES.mockErc20} />
        <TokenBalanceCard label="LINK (Sepolia)" tokenAddress={LINK_TOKEN_ADDRESS} />
        <FaucetCard />
      </div>
    </section>
  );
}
