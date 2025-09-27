# Deployment Guide for Celo Sepolia

## Prerequisites

1. **Get Celo Sepolia CELO tokens:**
   - Visit https://faucet.celo.org/
   - Connect your wallet and get testnet CELO

2. **Set up your environment:**
   ```bash
   # Copy the environment template
   cp env.example .env
   
   # Edit .env file with your actual values
   nano .env
   ```

3. **Required environment variables in .env:**
   ```bash
   # Your wallet private key (with 0x prefix)
   PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
   
   # Optional: CeloScan API key for verification
   CELOSCAN_API_KEY=your_api_key_here
   ```

## Deployment Steps

1. **Compile contracts:**
   ```bash
   npm run compile
   ```

2. **Deploy to Celo Sepolia:**
   ```bash
   npm run deploy:celo-sepolia
   ```

3. **Expected output:**
   ```
   Deploying AgeVerification contract to Celo Sepolia...
   Using Self Protocol Hub: 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74
   Verification Config: { olderThan: 18, forbiddenCountries: [ 'USA' ], ofacEnabled: false }
   Deploying with account: 0xYourAddress
   Account balance: 1.0 CELO
   Deploying AgeVerification contract...
   ✅ AgeVerification deployed to: 0xContractAddress
   🔗 View on explorer: https://celo-sepolia.blockscout.com/address/0xContractAddress
   📋 Verification Config ID: 0xConfigId
   ```

4. **Update frontend .env:**
   After successful deployment, update your frontend `.env` file:
   ```bash
   cd ../frontend
   nano .env
   ```
   
   Add these lines:
   ```bash
   REACT_APP_AGE_VERIFICATION_CONTRACT=0xYourDeployedContractAddress
   REACT_APP_SELF_ENDPOINT=0xYourDeployedContractAddress
   REACT_APP_SELF_APP_NAME="IWasBored Age Verification"
   REACT_APP_SELF_SCOPE="iwasbored-age-verification"
   ```

## Troubleshooting

### "Cannot read properties of undefined (reading 'getSigners')"
This means the ethers plugin isn't loading properly. Make sure you have:
- `"type": "module"` in package.json
- `import "@nomicfoundation/hardhat-ethers";` in hardhat.config.js

### "Network: hardhat" instead of "celo-sepolia"
Make sure you're running the correct command:
```bash
npm run deploy:celo-sepolia
```

### "Account balance: 0.0 CELO"
You need testnet CELO tokens. Visit https://faucet.celo.org/

### "PRIVATE_KEY not set"
Make sure your .env file has the correct private key:
```bash
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
```

## Network Information

- **Network**: Celo Sepolia Testnet
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org
- **Chain ID**: 11142220
- **Explorer**: https://celo-sepolia.blockscout.com/
- **Self Protocol Hub**: 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74

## Security Notes

- Never commit your actual private key to git
- Use a testnet-only wallet for development
- Keep your mainnet private keys secure and separate
