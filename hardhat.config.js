require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Variables de entorno (definir en .env o exportarlas en la shell):
//   SEPOLIA_RPC_URL = endpoint RPC de un provider (Infura/Alchemy/QuickNode)
//   PRIVATE_KEY     = clave privada de la cuenta que despliega (con o sin "0x")
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const RAW_PRIVATE_KEY = process.env.PRIVATE_KEY || "";
// Aceptamos la clave con o sin el prefijo 0x (MetaMask la exporta sin él).
const PRIVATE_KEY = RAW_PRIVATE_KEY
  ? RAW_PRIVATE_KEY.startsWith("0x")
    ? RAW_PRIVATE_KEY
    : `0x${RAW_PRIVATE_KEY}`
  : "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
