# 🟣 Polygon Amoy Testnet Deployment Guide

This guide will help you deploy and test the SimplePredictionsOracle on Polygon Amoy testnet.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v16 or higher)
- **Hardhat** development environment
- **Polygon Amoy MATIC** for gas fees
- **Private key** for deployment

### 2. Get Testnet MATIC

Visit the Polygon faucet to get testnet MATIC:
- 🔗 **https://faucet.polygon.technology/**
- Select "Polygon Amoy"
- Enter your wallet address
- Get 0.5 MATIC (sufficient for deployment)

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC URL
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology/

# Optional: PolygonScan API key for verification
POLYGONSCAN_API_KEY=your_api_key_here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Deploy to Polygon Amoy

```bash
npx hardhat run scripts/deploy-amoy.js --network amoy
```

This will deploy all contracts and configure the system automatically.

## 📋 Deployment Process

The deployment script will:

1. **Deploy ERC20 Token** - Test token for the prediction markets
2. **Deploy ConditionalTokens** - Handles market positions
3. **Deploy Factory** - Creates market maker contracts
4. **Deploy SimplePredictionsOracle** - Main oracle contract with PYTH integration
5. **Configure System** - Set up contracts to work together
6. **Fund Oracle** - Transfer tokens for market creation
7. **Configure Markets** - Set up random market parameters
8. **Create Test Market** - Demonstrate functionality

## 🎯 Network Information

- **Network**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC URL**: https://rpc-amoy.polygon.technology/
- **Block Explorer**: https://amoy.polygonscan.com/
- **PYTH Oracle**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`

## 🧪 Testing Commands

After deployment, you'll get contract addresses. Update your `.env` file:

```bash
AMOY_POP_TOKEN=0x...
AMOY_CONDITIONAL_TOKENS=0x...
AMOY_FACTORY=0x...
AMOY_ORACLE=0x...
```

### Check System Status
```bash
npx hardhat run scripts/check-markets-amoy.js --network amoy
```

### Create Random Market
```bash
npx hardhat run scripts/create-market-amoy.js --network amoy
```

### Monitor Markets
```bash
# Check oracle status
npx hardhat run scripts/check-markets-amoy.js --network amoy

# View on block explorer
open https://amoy.polygonscan.com/address/YOUR_ORACLE_ADDRESS
```

## 🎲 PYTH Price Feeds

The system uses these PYTH price feeds on Polygon Amoy:

| Asset | Price Feed ID |
|-------|---------------|
| ETH/USD | `0xff61491a...` |
| BTC/USD | `0xe62df6c8...` |
| MATIC/USD | `0x5de33a91...` |
| SOL/USD | `0xef0d8b6f...` |

## 🔧 Contract Features

### Random Market Creation
- Automatically selects random price feeds
- Sets random target prices (±5% to ±20%)
- Creates binary markets (target reached/not reached)
- Configurable market intervals

### PYTH Oracle Integration
- Real-time price updates
- Multiple asset support
- Gas-efficient operations
- Staleness protection

### Automated Resolution
- Markets resolve when expired
- Price-based outcomes
- Automatic payout distribution

## 📊 Expected Gas Costs

| Operation | Estimated Gas | Cost (50 gwei) |
|-----------|---------------|----------------|
| Deploy All Contracts | ~2,000,000 | ~0.1 MATIC |
| Create Random Market | ~300,000 | ~0.015 MATIC |
| Buy Position | ~150,000 | ~0.0075 MATIC |
| Resolve Market | ~120,000 | ~0.006 MATIC |

## 🛠️ Troubleshooting

### Common Issues

1. **"Insufficient funds" error**
   - Get more MATIC from the faucet
   - Check your balance: `npx hardhat run scripts/check-balance.js --network amoy`

2. **"Nonce too high" error**
   - Wait a moment and retry
   - Clear transaction pool if using MetaMask

3. **"Market interval not elapsed"**
   - Wait for the configured interval (default: 3 minutes)
   - Check status: `npx hardhat run scripts/check-markets-amoy.js --network amoy`

4. **"PYTH oracle error"**
   - Network connectivity issue
   - PYTH oracle temporarily unavailable
   - Try again later

### Debug Commands

```bash
# Check account balance
npx hardhat run scripts/check-balance.js --network amoy

# Verify contract on PolygonScan
npx hardhat verify --network amoy CONTRACT_ADDRESS

# Test PYTH oracle connectivity
npx hardhat run scripts/test-pyth.js --network amoy
```

## 🔍 Monitoring and Analytics

### Block Explorer
Monitor all transactions and contracts:
- **Base URL**: https://amoy.polygonscan.com/
- **Your Oracle**: https://amoy.polygonscan.com/address/YOUR_ORACLE_ADDRESS
- **Transactions**: Filter by "Internal Transactions" to see market creations

### PYTH Network
Monitor price feed status:
- **PYTH Dashboard**: https://pyth.network/price-feeds
- **Feed Health**: Check for recent updates
- **Staleness**: Ensure prices are fresh

### Market Analytics
Track market performance:
```bash
# Get market statistics
npx hardhat run scripts/market-stats.js --network amoy

# Export market data
npx hardhat run scripts/export-data.js --network amoy
```

## 🧪 Testing Scenarios

### Scenario 1: Basic Market Creation
```bash
# 1. Deploy contracts
npx hardhat run scripts/deploy-amoy.js --network amoy

# 2. Check system status
npx hardhat run scripts/check-markets-amoy.js --network amoy

# 3. Create a random market
npx hardhat run scripts/create-market-amoy.js --network amoy
```

### Scenario 2: Market Trading
```bash
# 1. Get some tokens from contract owner
# 2. Buy positions in a market
npx hardhat run scripts/buy-position-amoy.js --network amoy

# 3. Wait for market to expire
# 4. Resolve market
npx hardhat run scripts/resolve-market-amoy.js --network amoy

# 5. Redeem winnings
npx hardhat run scripts/redeem-positions-amoy.js --network amoy
```

### Scenario 3: Automated Testing
```bash
# Run comprehensive test suite on testnet
npm run test:amoy:full
```

## 🔐 Security Considerations

### Testnet Only
- **Never use mainnet private keys**
- **Use dedicated testnet wallets**
- **Don't store real value on testnet**

### Best Practices
- Keep private keys secure
- Use environment variables
- Verify contract addresses
- Monitor gas usage

### Rate Limiting
- PYTH oracle has rate limits
- Public RPCs have rate limits
- Space out transactions appropriately

## 📈 Performance Optimization

### Gas Optimization
- Use batch operations when possible
- Optimize market creation intervals
- Monitor gas prices

### RPC Optimization
- Use dedicated RPC endpoints for better performance
- Consider rate limiting for production

### PYTH Optimization
- Cache price data when appropriate
- Use batch price updates
- Monitor PYTH network status

## 🎉 Success Metrics

After deployment, you should see:
- ✅ All contracts deployed successfully
- ✅ System configuration completed
- ✅ Test market created
- ✅ PYTH price feeds working
- ✅ No gas estimation errors

## 🆘 Support

If you encounter issues:

1. **Check the logs** - Deployment script provides detailed output
2. **Verify balances** - Ensure sufficient MATIC for operations
3. **Test connectivity** - Verify RPC and PYTH oracle access
4. **Review configuration** - Double-check environment variables
5. **Consult documentation** - PYTH and Polygon documentation

## 🔗 Useful Links

- **Polygon Amoy Explorer**: https://amoy.polygonscan.com/
- **Polygon Faucet**: https://faucet.polygon.technology/
- **PYTH Network**: https://pyth.network/
- **PYTH Price Feeds**: https://pyth.network/price-feeds
- **Hardhat Documentation**: https://hardhat.org/docs

---

**Ready to test on Polygon Amoy!** 🚀

Start with the deployment command and follow the guided process. The system will automatically configure everything needed for PYTH oracle-powered prediction markets.
