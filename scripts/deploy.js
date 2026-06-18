const hre = require("hardhat");

// ---------------------------------------------------------------------------
// Despliega los tres contratos de la entrega en el orden correcto:
//   1) MockERC20  -> token de pago del marketplace (faucet abierto, testnet)
//   2) Multisig   -> evaluador M-de-N (Entrega 2). Reemplazá los signers/threshold.
//   3) JobMarketplace(token) -> marketplace con escrow en el token anterior.
//
// Antes de correr en Sepolia, completá .env con SEPOLIA_RPC_URL y PRIVATE_KEY,
// y ajustá SIGNERS/THRESHOLD con las wallets reales del equipo.
// Uso: npx hardhat run scripts/deploy.js --network sepolia
// ---------------------------------------------------------------------------

// CONFIGURÁ ACÁ los signers y el threshold del Multisig evaluador.
const SIGNERS = [
  "0x0000000000000000000000000000000000000001",
  "0x0000000000000000000000000000000000000002",
  "0x0000000000000000000000000000000000000003",
];
const THRESHOLD = 2;

// Datos del token de prueba.
const TOKEN_NAME = "Mock USD";
const TOKEN_SYMBOL = "mUSD";
// Cantidad inicial a acuñar para el deployer (para poder fondear trabajos en la demo).
const INITIAL_MINT = hre.ethers.parseEther("1000000");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Token ERC-20 de pago.
  console.log("\nDesplegando MockERC20...");
  const Token = await hre.ethers.getContractFactory("MockERC20");
  const token = await Token.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("  MockERC20:", tokenAddress);

  await (await token.mint(deployer.address, INITIAL_MINT)).wait();
  console.log("  Minteados", hre.ethers.formatEther(INITIAL_MINT), TOKEN_SYMBOL, "al deployer");

  // 2) Multisig evaluador.
  console.log("\nDesplegando Multisig (evaluador)...");
  console.log("  Signers:  ", SIGNERS);
  console.log("  Threshold:", THRESHOLD);
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const multisig = await Multisig.deploy(SIGNERS, THRESHOLD);
  await multisig.waitForDeployment();
  const multisigAddress = await multisig.getAddress();
  console.log("  Multisig:", multisigAddress);

  // 3) JobMarketplace con escrow en el token.
  console.log("\nDesplegando JobMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("JobMarketplace");
  const marketplace = await Marketplace.deploy(tokenAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("  JobMarketplace:", marketplaceAddress);

  console.log("\n✅ Deploy completo. Guardá estas direcciones en el README y en frontend/src/config.ts:");
  console.log("  MockERC20:      ", tokenAddress);
  console.log("  Multisig:       ", multisigAddress);
  console.log("  JobMarketplace: ", marketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
