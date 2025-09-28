# IWasBored Prediction Markets Contracts

Smart contracts for multi-chain prediction markets with PYTH oracle integration.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp env.example .env
# Edit .env and add your private key and configuration
```

### 3. Get Testnet Tokens

**Ethereum Sepolia:**
- Visit https://sepoliafaucet.com/
- Get testnet ETH for gas fees

**Celo Sepolia:**
- Visit https://faucet.celo.org/
- Get testnet CELO for gas fees

## 🌐 Supported Networks

### Ethereum Sepolia (Primary)
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **Block Explorer**: https://sepolia.etherscan.io/
- **PYTH Oracle**: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21

### Celo Sepolia (Age Verification)
- **Chain ID**: 11142220
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org
- **Block Explorer**: https://celo-sepolia.blockscout.com/
- **Self Protocol Hub**: 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74

### Celo Mainnet (Production)
- **Chain ID**: 42220
- **Self Protocol Hub**: 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF

## 📋 Environment Variables

### Required for Ethereum Sepolia
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Contract addresses (set after deployment)
SEPOLIA_ORACLE=0xYOUR_ORACLE_ADDRESS
SEPOLIA_TOKEN=0xYOUR_TOKEN_ADDRESS
SEPOLIA_CONDITIONAL_TOKENS=0xYOUR_CT_ADDRESS
SEPOLIA_FACTORY=0xYOUR_FACTORY_ADDRESS
```

### Required for Celo Networks
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
# Celo RPC URL - use Sepolia for testing, Mainnet for production
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_MAINNET_RPC_URL=https://forno.celo.org

# Optional: CeloScan API key for verification
CELOSCAN_API_KEY=your_api_key_here
```

## 🏗️ Contract Details

### Core Prediction Markets (Ethereum)
- **Network**: Ethereum Sepolia Testnet
- **PYTH Oracle**: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
- **Markets**: Binary prediction markets (price up/down)
- **Price Feeds**: ETH/USD, BTC/USD, SOL/USD, USDC/USD
- **Duration**: 5 minutes to 1 hour (configurable)

### Age Verification (Celo)
- **Purpose**: Age verification for users
- **Verification Hub**: Self Protocol integration
- **Scope**: "iwasbored"
- **Minimum Age**: 18 years
- **Forbidden Countries**: ["USA"]
- **OFAC Enabled**: false

## 🚀 Deployment

### Ethereum Sepolia Deployment
```bash
# Deploy all prediction market contracts
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Deploy individual contracts
npx hardhat run scripts/deploy.js --network sepolia

# Deploy with enhanced output
npx hardhat run scripts/deploy-simple.js --network sepolia
```

### Celo Sepolia Deployment (Age Verification)
```bash
npx hardhat run scripts/deploy.js --network celo-sepolia
```

### Celo Mainnet Deployment (Age Verification)
```bash
npx hardhat run scripts/deploy.js --network celo-mainnet
```

## 📊 Market Management

### Create Markets
```bash
# Create basic market
npx hardhat run scripts/create-market-sepolia.js --network sepolia

# Create enhanced market with detailed output
npx hardhat run scripts/create-market-sepolia-enhanced.js --network sepolia

# Create automatic random markets
npx hardhat run scripts/automate-markets.js --network sepolia
```

### Check Markets
```bash
# Basic market status
npx hardhat run scripts/check-markets-sepolia.js --network sepolia

# Enhanced market analysis
npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia

# Check specific scope
npx hardhat run scripts/check-scope.js --network sepolia
```

### Resolve Markets
```bash
# Manually resolve expired market
npx hardhat run scripts/resolve-market-sepolia.js --network sepolia
```

## 💰 Trading Operations

### Buy Positions
```bash
# Buy position in an active market
npx hardhat run scripts/buy-position-sepolia.js --network sepolia
```

### Redeem Winnings
```bash
# Redeem winnings from resolved markets
npx hardhat run scripts/redeem-positions-sepolia.js --network sepolia
```

## 🧪 Testing & Automation

### Contract Testing
```bash
# Run contract tests
npm run test

# Test deployed oracle contract
npx hardhat run scripts/test-oracle-deployed.js --network sepolia

# Test PYTH oracle integration
npx hardhat run scripts/test-pyth-sepolia.js --network sepolia

# Test network connectivity
npx hardhat run scripts/test-network.js --network sepolia

# Test age verification
npx hardhat run scripts/test-age-verification.js --network sepolia
```

### Automation Scripts
```bash
# Automated market creation and resolution
npx hardhat run scripts/automate-markets.js --network sepolia

# Deploy and verify contracts
npx hardhat run scripts/verify-contract.js --network sepolia

# Test deployment of all contracts
npx hardhat run scripts/test-deployed.js --network sepolia
```

## 🔧 Core Scripts Overview

### Deployment Scripts
- `deploy-sepolia.js` - Deploy all contracts to Sepolia with PYTH integration
- `deploy.js` - Deploy age verification contract (Celo networks)
- `deploy-simple.js` - Simple deployment script
- `test-deployed.js` - Test contract deployment

### Market Management Scripts
- `create-market-sepolia.js` - Create basic prediction market
- `create-market-sepolia-enhanced.js` - Enhanced market creation with detailed output
- `check-markets-sepolia.js` - Check market status and configuration
- `check-markets-sepolia-enhanced.js` - Detailed market analysis
- `resolve-market-sepolia.js` - Manually resolve expired market
- `check-scope.js` - Check specific scope markets

### Trading Scripts
- `buy-position-sepolia.js` - Buy position in active market
- `redeem-positions-sepolia.js` - Redeem winnings from resolved markets

### Testing Scripts
- `test-oracle-deployed.js` - Test deployed oracle functionality
- `test-pyth-sepolia.js` - Test PYTH oracle integration
- `test-network.js` - Test network connectivity
- `test-age-verification.js` - Test age verification contract

## 🔄 Market Lifecycle

1. **Create Market**: Oracle selects random PYTH price feed and records initial price
2. **Trading Period**: Users buy positions on price direction (up/down)
3. **Market Expiry**: Trading stops when market end time is reached
4. **Resolution**: Final price is fetched from PYTH, winners determined
5. **Redemption**: Winning position holders redeem tokens

## 🎯 PYTH Integration

### Supported Price Feeds
```javascript
const PRICE_FEEDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
};
```

### Random Market Creation Features
- **Random Asset Selection**: Chooses from configured price feeds
- **Random Target Price**: ±5% to ±20% from current price
- **Random Duration**: Configurable min/max range
- **Random Direction**: Price up or down prediction
- **Automatic Creation**: Configurable intervals for market generation

### Market Configuration
- **Min Duration**: 5 minutes (300 seconds)
- **Max Duration**: 1 hour (3600 seconds)  
- **Market Interval**: 3 minutes (180 seconds)
- **Initial Funding**: 10 tokens per market
- **Auto-Creation**: Enabled

## 🏗️ Smart Contract Architecture

### Core Contracts (Ethereum)
- **ERC20.sol**: Test token for market participation
- **ConditionalTokens.sol**: Core prediction market infrastructure  
- **Factory.sol**: Creates Fixed Product Market Makers
- **SimplePredictionsOracle.sol**: Main oracle with PYTH integration
- **FixedProductMarketMaker.sol**: Market maker for binary outcomes
- **CTHelpers.sol**: Helper functions for conditional tokens

### Age Verification Contracts (Celo)
- **AgeVerification.sol**: Age verification contract with Self Protocol integration
- **MockIdentityVerificationHub.sol**: Mock verification hub for testing

### Interface Contracts
- **IConditionalTokens.sol**: Conditional tokens interface
- **IFactory.sol**: Factory interface
- **IFixedProductMarketMaker.sol**: Market maker interface
- **IPredictionsOracle.sol**: Oracle interface

## 🔍 Contract Verification

### Etherscan (Ethereum Networks)
```bash
# Manual verification if automatic fails
npx hardhat verify --network sepolia CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

### BlockScout (Celo Networks)
Contracts are automatically verified on BlockScout during deployment.

## 🛠️ Troubleshooting

### Common Issues

**Insufficient Funds**
- Ethereum Sepolia: Get ETH from https://sepoliafaucet.com/
- Celo Sepolia: Get CELO from https://faucet.celo.org/

**Connection Issues**
- Check RPC URLs in .env file
- Ensure network configuration in hardhat.config.js is correct
- Test network connectivity with `test-network.js`

**Market Creation Fails**
- Check PYTH oracle connectivity
- Ensure sufficient update fee (~0.001 ETH)
- Verify oracle has sufficient token balance
- Use `check-markets-sepolia.js` to see active markets

**Contract Verification Failures**
- Ensure API keys are set correctly
- Use manual verification commands if automatic fails
- Wait a few minutes after deployment before verification

### Environment Setup Issues

**Missing Contract Addresses**
```bash
# Run deployment first
npx hardhat run scripts/deploy-sepolia.js --network sepolia
# Copy addresses to .env file
```

**Network Configuration**
```bash
# Check network configuration
npx hardhat network
# Verify chain IDs match your network
```

## 🔐 Security Notes

- Use testnet-only private keys
- Never commit `.env` files to git
- Verify contract addresses before use
- Test thoroughly before mainnet deployment
- Use hardware wallets for mainnet deployments
- Consider using separate keys for testnet and mainnet
- Validate PYTH price data before use
- Ensure price updates are recent (within acceptable staleness)
- Monitor network status and oracle reliability

## 📊 Gas Costs

### Estimated Gas Costs
- Create random market: ~300,000 gas
- Resolve market: ~150,000 gas per market
- Update price feeds: ~50,000 gas
- PYTH update fee: ~0.001 ETH per update
- Market position purchase: ~100,000 gas

### Gas Optimization
- No fixed gas prices - adapts to network conditions
- Efficient deployment streamlines contract deployment
- Low test costs - minimal ETH required for testing

## 🌟 Frontend Integration

### After Ethereum Sepolia Deployment
```bash
# Add these to your frontend .env:
SEPOLIA_ORACLE=0xYourDeployedOracleAddress
SEPOLIA_TOKEN=0xYourDeployedTokenAddress
SEPOLIA_CONDITIONAL_TOKENS=0xYourDeployedConditionalTokensAddress
SEPOLIA_FACTORY=0xYourDeployedFactoryAddress
```

### After Celo Deployment (Age Verification)
```bash
# Add these to your frontend .env:
REACT_APP_AGE_VERIFICATION_CONTRACT=0xYourDeployedContractAddress
REACT_APP_SELF_ENDPOINT=0xYourDeployedContractAddress
REACT_APP_SELF_APP_NAME="IWasBored Age Verification"
REACT_APP_SELF_SCOPE="iwasbored"
```

## 🔗 Useful Links

- **Ethereum Sepolia Faucet**: https://sepoliafaucet.com/
- **Alternative Sepolia Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **Celo Faucet**: https://faucet.celo.org/
- **Celo Sepolia Explorer**: https://celo-sepolia.blockscout.com/
- **PYTH Network**: https://pyth.network/price-feeds
- **Alchemy RPC**: https://www.alchemy.com/
- **Infura RPC**: https://infura.io/
- **Etherscan API**: https://etherscan.io/apis
- **Celo Developer Docs**: https://docs.celo.org/
- **Self Protocol**: https://self.xyz/

## 📈 Deployment Success Checklist

Once deployed successfully, your prediction market system is ready for:

### Ethereum Sepolia Prediction Markets
- ✅ Creating price-based prediction markets
- ✅ PYTH Network price feed integration
- ✅ Automatic market resolution
- ✅ User position management
- ✅ Decentralized market making
- ✅ Random market creation
- ✅ Enhanced market monitoring

### Celo Age Verification
- ✅ Age verification with Self Protocol
- ✅ Integration with frontend applications
- ✅ Configurable verification parameters
- ✅ Mainnet deployment safety checks
- ✅ Contract verification on BlockScout

## 🎉 Conclusion

Happy testing and deploying your prediction markets! 🚀

For any issues or questions:
1. Check the troubleshooting section above
2. Review script outputs for detailed error messages
3. Monitor network status and contract explorers
4. Test thoroughly before moving to mainnet