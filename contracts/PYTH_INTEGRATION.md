# PYTH Oracle Integration for Random Prediction Markets

This document explains the PYTH oracle integration that enables automatic creation and resolution of prediction markets.

## Overview

The enhanced `SimplePredictionsOracle` contract now includes:
- **Random Market Creation**: Automatically creates prediction markets using PYTH price feeds
- **Automatic Resolution**: Resolves markets based on real-time price data from PYTH
- **Price Feed Management**: Configurable price feeds for different assets
- **Scheduled Market Generation**: Configurable intervals for market creation

## Key Features

### 1. PYTH Oracle Integration
- Uses PYTH's pull-based oracle model for accurate, real-time price data
- Supports multiple price feeds (ETH/USD, BTC/USD, SOL/USD, etc.)
- Automatic price feed updates with minimal gas costs

### 2. Random Market Creation
- Creates markets with random:
  - Asset selection from configured price feeds
  - Target price (±5% to ±20% from current price)
  - Market duration (configurable min/max range)
  - Direction (price up or down)

### 3. Automatic Resolution
- Markets automatically resolve when they expire
- Resolution based on whether the target price was reached
- Binary outcomes: "Target Reached" vs "Target Not Reached"

## Smart Contract Changes

### New Structs
```solidity
struct RandomMarketConfig {
    bytes32[] priceIds;        // Available PYTH price feed IDs
    uint256 minDuration;       // Minimum market duration
    uint256 maxDuration;       // Maximum market duration
    uint256 marketInterval;    // Interval between markets
    uint256 initialFunding;    // Initial funding per market
    bool autoCreateEnabled;    // Enable/disable auto creation
}
```

### Enhanced QuestionData
```solidity
struct QuestionData {
    // ... existing fields ...
    bytes32 priceId;        // PYTH price feed ID
    int64 targetPrice;      // Target price for resolution
    bool isRandomMarket;    // Flag for random markets
}
```

### New Functions
- `configureRandomMarkets()` - Configure random market parameters
- `createRandomMarket()` - Create a new random market
- `autoResolveMarkets()` - Resolve expired markets automatically
- `updatePriceFeeds()` - Update PYTH price feeds
- `getCurrentPrice()` - Get current price for a feed
- `canCreateRandomMarket()` - Check if new market can be created

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @pythnetwork/pyth-sdk-solidity
```

### 2. Update Contract Deployment
When deploying or upgrading the oracle contract, include the PYTH oracle address:

```javascript
await oracle.updateContracts(
    conditionalTokensAddress,
    FPMMFactoryAddress,
    collateralTokenAddress,
    pythOracleAddress  // Add PYTH oracle address
);
```

### 3. Configure Random Markets
```javascript
const priceIds = [
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD
    // ... more price feeds
];

await oracle.configureRandomMarkets(
    priceIds,
    300,  // 5 minutes min duration
    3600, // 1 hour max duration
    180,  // 3 minutes between markets
    ethers.parseEther("100"), // 100 tokens initial funding
    true  // Enable auto creation
);
```

## PYTH Price Feed IDs

Common price feeds for testing:

| Asset | Price Feed ID |
|-------|---------------|
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |
| AVAX/USD | `0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7` |
| MATIC/USD | `0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52` |

Find more price feeds at: https://pyth.network/developers/price-feed-ids

## PYTH Oracle Addresses

### Mainnet Addresses
- **Ethereum**: `0x4305FB66699C3B2702D4d05CF36551390A4c69C6`
- **Polygon**: `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C`
- **Avalanche**: `0x4305FB66699C3B2702D4d05CF36551390A4c69C6`
- **Arbitrum**: `0xff1a0f4744e8582DF1aE09D5611b887B6a12925C`

### Testnet Addresses
- **Sepolia**: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`
- **Mumbai**: `0xd0D9315473E8dbb22Af0525123Df3e50Da71700B`
- **Fuji**: `0xd0D9315473E8dbb22Af0525123Df3e50Da71700B`
- **Ethereum Sepolia**: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`

## Usage Examples

### Create Random Market
```javascript
// Get price update data from PYTH Hermes API
const priceUpdateData = await fetchPriceData();
const updateFee = await pythOracle.getUpdateFee(priceUpdateData);

const tx = await oracle.createRandomMarket(priceUpdateData, {
    value: updateFee
});
```

### Resolve Expired Markets
```javascript
const expiredMarkets = ["0x...", "0x..."]; // Question IDs
const priceUpdateData = await fetchPriceData();
const updateFee = await pythOracle.getUpdateFee(priceUpdateData);

await oracle.autoResolveMarkets(expiredMarkets, priceUpdateData, {
    value: updateFee
});
```

### Monitor Market Status
```javascript
const canCreate = await oracle.canCreateRandomMarket();
const config = await oracle.getRandomMarketConfig();
const price = await oracle.getCurrentPrice(priceId);
```

## Automation Script

Use the provided automation script to run continuous market creation:

```bash
# Set environment variables
export ORACLE_ADDRESS=0x...
export PYTH_ORACLE_ADDRESS=0x...

# Run automation
node scripts/automate-markets.js
```

## Gas Costs

Estimated gas costs:
- Create random market: ~300,000 gas
- Resolve market: ~150,000 gas per market
- Update price feeds: ~50,000 gas
- PYTH update fee: ~0.001 ETH per update

## Security Considerations

1. **Price Feed Validation**: Always validate PYTH price data before use
2. **Update Frequency**: Price updates should be recent (within acceptable staleness)
3. **Fee Management**: Ensure sufficient ETH for PYTH update fees
4. **Access Control**: Only authorized addresses should create/resolve markets
5. **Circuit Breakers**: Implement emergency stops for unusual market conditions

## Events

New events for monitoring:
```solidity
event RandomMarketCreated(bytes32 indexed questionId, bytes32 indexed priceId, int64 targetPrice, uint256 endTimestamp, address fpmmAddress);
event PriceUpdated(bytes32 indexed priceId, int64 price, uint64 publishTime);
event AutoResolutionTriggered(bytes32 indexed questionId, int64 finalPrice, int64 targetPrice, bool targetReached);
```

## Testing

The integration has been tested with:
- ✅ PYTH price feed integration
- ✅ Random market creation
- ✅ Automatic market resolution
- ✅ Price feed updates
- ✅ Error handling and validation

## Support

For issues or questions:
1. Check PYTH documentation: https://docs.pyth.network/
2. Review price feed status: https://pyth.network/price-feeds
3. Monitor network status: https://status.pyth.network/
