require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-gas-reporter');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000, // Higher runs for better optimization
      },
    },
  },
  networks: {
    "celo-sepolia": {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0x093cfb88e8530420e563bf195094195c10adfa0d5834290a1366ff6bc128867a"]
    },
    "celo-mainnet": {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0x093cfb88e8530420e563bf195094195c10adfa0d5834290a1366ff6bc128867a"]
    },
    base: {
      url: process.env.RPC_URL_CONDUIT || "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0x093cfb88e8530420e563bf195094195c10adfa0d5834290a1366ff6bc128867a"]
    }
  },
  etherscan: {
    apiKey: {
      "celo-sepolia": "abc",  // BlockScout doesn't require a real API key
      "celo-mainnet": "abc",   // BlockScout doesn't require a real API key
      "conduit": "",
      "polygonAmoy": process.env.POLYGONSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "celo-sepolia", 
        chainId: 11142220,
        urls: {
          apiURL: "https://celo-sepolia.blockscout.com/api",
          browserURL: "https://celo-sepolia.blockscout.com"
        }
      },
      {
        network: "celo-mainnet",
        chainId: 42220,
        urls: {
          apiURL: "https://celo.blockscout.com/api",
          browserURL: "https://celo.blockscout.com"
        }
      },
      {
        network: "conduit",
        chainId: 8453,
        urls: {
          apiURL: `https://api.etherscan.io/v2/api?chainid=8453`,
          browserURL: "https://basescan.org/",
        }
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? false : true
  }
};
