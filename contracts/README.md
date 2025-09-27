# IWasBored Prediction Markets Contracts

Smart contracts for PYTH-powered prediction markets on Ethereum Sepolia.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env and add your private key
   ```

3. **Get testnet tokens:**
   - Visit https://sepoliafaucet.com/
   - Connect your wallet and get Sepolia ETH

4. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy-sepolia.js --network sepolia
   ```

5. **Update environment:**
   Copy the contract addresses from deployment output to your `.env` file.

## Environment Variables

Required in `.env` file:
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Contract addresses (set after deployment)
SEPOLIA_ORACLE=0xYOUR_ORACLE_ADDRESS
SEPOLIA_TOKEN=0xYOUR_TOKEN_ADDRESS
SEPOLIA_CONDITIONAL_TOKENS=0xYOUR_CT_ADDRESS
SEPOLIA_FACTORY=0xYOUR_FACTORY_ADDRESS
```

## Contract Details

- **Network**: Ethereum Sepolia Testnet
- **PYTH Oracle**: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
- **Markets**: Binary prediction markets (price up/down)
- **Price Feeds**: ETH/USD, BTC/USD, SOL/USD, USDC/USD

## Core Scripts

### Deployment
- `deploy-sepolia.js` - Deploy all contracts to Sepolia
- `deploy.js` - Deploy age verification (legacy)

### Market Management
- `create-market-sepolia.js` - Create a new prediction market
- `create-market-sepolia-enhanced.js` - Enhanced market creation with detailed output
- `check-markets-sepolia.js` - Check market status and configuration
- `check-markets-sepolia-enhanced.js` - Detailed market analysis
- `resolve-market-sepolia.js` - Manually resolve an expired market

### Trading
- `buy-position-sepolia.js` - Buy a position in an active market
- `redeem-positions-sepolia.js` - Redeem winnings from resolved markets

### Testing & Automation
- `test-oracle-deployed.js` - Test deployed oracle contract functionality
- `test-pyth-sepolia.js` - Test PYTH oracle integration
- `automate-markets.js` - Automated market creation and resolution

## Usage Examples

### 1. Deploy Contracts
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### 2. Create a Market
```bash
# Set oracle address from deployment
export SEPOLIA_ORACLE=0x...
npx hardhat run scripts/create-market-sepolia.js --network sepolia
```

### 3. Buy a Position
```bash
# Set both oracle and token addresses
export SEPOLIA_ORACLE=0x...
export SEPOLIA_TOKEN=0x...
npx hardhat run scripts/buy-position-sepolia.js --network sepolia
```

### 4. Resolve Market
```bash
# Resolve a specific market
export MARKET_ID=0x...
npx hardhat run scripts/resolve-market-sepolia.js --network sepolia
```

### 5. Redeem Winnings
```bash
npx hardhat run scripts/redeem-positions-sepolia.js --network sepolia
```

### 6. Check Status
```bash
npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia
```

## Market Lifecycle

1. **Create Market**: Oracle selects random PYTH price feed and records initial price
2. **Trading Period**: Users buy positions on price direction (up/down)
3. **Market Expiry**: Trading stops when market end time is reached
4. **Resolution**: Final price is fetched from PYTH, winners determined
5. **Redemption**: Winning position holders redeem tokens

## PYTH Integration

The contracts use PYTH oracle for real-time price data:

- **Price Feeds**: ETH/USD, BTC/USD, SOL/USD, USDC/USD
- **Update Fees**: ~0.001 ETH per price update
- **Staleness**: Prices must be recent for accurate resolution

### Supported Price Feeds
```javascript
const PRICE_FEEDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
};
```

## Testing

Run contract tests:
```bash
npm run test
```

Test deployed contracts:
```bash
npx hardhat run scripts/test-oracle-deployed.js --network sepolia
```

Test PYTH integration:
```bash
npx hardhat run scripts/test-pyth-sepolia.js --network sepolia
```

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**
   - Get Sepolia ETH from https://sepoliafaucet.com/

2. **"Market not found"**
   - Check market ID and ensure it exists
   - Use `check-markets-sepolia.js` to see active markets

3. **"Price feed error"**
   - PYTH oracle might be temporarily unavailable
   - Check https://pyth.network/ for status

4. **"Transaction reverted"**
   - Check gas fees and network congestion
   - Ensure contract addresses are correct

### Environment Setup Issues

1. **Missing contract addresses**
   ```bash
   # Run deployment first
   npx hardhat run scripts/deploy-sepolia.js --network sepolia
   # Copy addresses to .env file
   ```

2. **Network connection issues**
   ```bash
   # Test network connectivity
   npx hardhat run scripts/test-network.js --network sepolia
   ```

## Security Notes

- Use testnet-only private keys
- Never commit `.env` files to git
- Verify contract addresses before use
- Test thoroughly before mainnet deployment

## Resources

- **Etherscan Sepolia**: https://sepolia.etherscan.io/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **PYTH Network**: https://pyth.network/
- **Hardhat Docs**: https://hardhat.org/docs