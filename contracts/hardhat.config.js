require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
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
    }
  },
  etherscan: {
    apiKey: {
      "celo-sepolia": "abc",  // BlockScout doesn't require a real API key
      "celo-mainnet": "abc"   // BlockScout doesn't require a real API key
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
      }
    ]
  },
  sourcify: {
    enabled: true
  }
};
