# 🔵 Ethereum Sepolia Testnet Deployment Guide

This guide will help you deploy and test the SimplePredictionsOracle on Ethereum Sepolia testnet.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v16 or higher)
- **Hardhat** development environment
- **Sepolia ETH** for gas fees
- **Private key** for deployment
- **Etherscan API key** for contract verification

### 2. Get Testnet ETH

Visit one of these Sepolia faucets to get testnet ETH:
- 🔗 **https://sepoliafaucet.com/**
- 🔗 **https://faucet.quicknode.com/ethereum/sepolia**
- Enter your wallet address
- Get 0.5 ETH (sufficient for deployment)

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Ethereum Sepolia RPC URL (get from Alchemy/Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Deploy to Ethereum Sepolia

```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

This will deploy all contracts, configure the system automatically, and verify contracts on Etherscan.

## 📋 Deployment Process

The deployment script will:

1. **Deploy Token Contract** - Test ERC20 token for market participation
2. **Deploy ConditionalTokens** - Core prediction market infrastructure  
3. **Deploy Factory** - Creates Fixed Product Market Makers
4. **Deploy SimplePredictionsOracle** - Main oracle contract with PYTH integration
5. **Configure System** - Set up relationships between contracts
6. **Fund Oracle** - Provide initial token funding
7. **Configure Markets** - Set up automatic market creation
8. **Verify Contracts** - Automatically verify all contracts on Etherscan
9. **Create Test Market** - Deploy a sample market for testing

## 🔧 Network Configuration

### Ethereum Sepolia Details:
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **Block Explorer**: https://sepolia.etherscan.io/
- **PYTH Oracle**: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21

### Supported Price Feeds:
- **ETH/USD**: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
- **BTC/USD**: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
- **USDC/USD**: 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
- **SOL/USD**: 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d

## 🎯 Post-Deployment

After successful deployment, you'll receive:

```bash
📝 Contract Addresses:
TOKEN: 0x1234...
CONDITIONAL_TOKENS: 0x5678...
FACTORY: 0x9abc...
ORACLE: 0xdef0...

🔗 Etherscan URLs:
TOKEN: https://sepolia.etherscan.io/address/0x1234...
CONDITIONAL_TOKENS: https://sepolia.etherscan.io/address/0x5678...
FACTORY: https://sepolia.etherscan.io/address/0x9abc...
ORACLE: https://sepolia.etherscan.io/address/0xdef0...

💡 Environment Variables:
SEPOLIA_TOKEN=0x1234...
SEPOLIA_CONDITIONAL_TOKENS=0x5678...
SEPOLIA_FACTORY=0x9abc...
SEPOLIA_ORACLE=0xdef0...
```

Add these to your `.env` file for future operations.

## 🧪 Testing & Interaction

### Create Additional Markets

```bash
npx hardhat run scripts/create-market-sepolia.js --network sepolia
```

### Check Market Status

```bash
npx hardhat run scripts/check-markets-sepolia.js --network sepolia
```

### Enhanced Market Monitoring

```bash
npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia
```

### Create Markets with Enhanced Features

```bash
npx hardhat run scripts/create-market-sepolia-enhanced.js --network sepolia
```

## 📊 Market Configuration

The oracle is configured with:

- **Min Duration**: 5 minutes (300 seconds)
- **Max Duration**: 1 hour (3600 seconds)  
- **Market Interval**: 3 minutes (180 seconds)
- **Initial Funding**: 10 tokens per market
- **Auto-Creation**: Enabled

## 💰 Gas Optimization

The deployment uses Hardhat's automatic gas estimation for optimal costs:

- **No Fixed Gas Prices**: Adapts to network conditions
- **Efficient Deployment**: Streamlined contract deployment
- **Low Test Costs**: Minimal ETH required for testing

## 🔍 Contract Verification

All contracts are automatically verified on Etherscan during deployment. If verification fails, manual commands are provided:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

## 🛠️ Troubleshooting

### Common Issues:

**Insufficient ETH Balance**
- Get more ETH from Sepolia faucets
- Ensure you have at least 0.1 ETH for deployment

**RPC Connection Issues**
- Check your SEPOLIA_RPC_URL in .env
- Try alternative RPC providers (Alchemy, Infura, QuickNode)

**Verification Failures**
- Ensure ETHERSCAN_API_KEY is set correctly
- Use manual verification commands if automatic fails

**Market Creation Fails**
- Check PYTH oracle connectivity
- Ensure sufficient update fee (0.001 ETH)
- Verify oracle has sufficient token balance

## 🔗 Useful Links

- **Ethereum Sepolia Faucet**: https://sepoliafaucet.com/
- **Alternative Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **PYTH Network**: https://pyth.network/price-feeds
- **Alchemy RPC**: https://www.alchemy.com/
- **Infura RPC**: https://infura.io/
- **Etherscan API**: https://etherscan.io/apis

## 🎉 Success!

Once deployed, your prediction market oracle is ready for:
- ✅ Creating price-based prediction markets
- ✅ PYTH Network price feed integration
- ✅ Automatic market resolution
- ✅ User position management
- ✅ Decentralized market making

Happy testing on Ethereum Sepolia! 🚀
