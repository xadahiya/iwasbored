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
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    "celo-mainnet": {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      "celo-sepolia": "abc",  // BlockScout doesn't require a real API key
      "celo-mainnet": "abc",   // BlockScout doesn't require a real API key
      "conduit": "",
      "sepolia": process.env.ETHERSCAN_API_KEY || ""
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
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io/",
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
