# IWasBored Age Verification Contracts

Smart contracts for age verification using Self Protocol on Celo Sepolia.

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
   - Visit https://faucet.celo.org/
   - Connect your wallet and get Celo Sepolia testnet tokens

4. **Deploy contract:**
   ```bash
   npm run deploy
   ```

5. **Update frontend:**
   Copy the contract address from deployment output to your frontend `.env` file.

## Environment Variables

Required in `.env` file:
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

## Contract Details

- **Network**: Celo Sepolia Testnet
- **Self Protocol Hub**: 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74
- **Verification**: Age 18+ required
- **Excluded Countries**: USA (for compliance)

## Scripts

- `npm run compile` - Compile contracts
- `npm run deploy` - Deploy to Celo Sepolia
- `npm run test` - Run tests
- `npm run clean` - Clean artifacts

## After Deployment

Add these variables to your frontend `.env`:
```bash
REACT_APP_AGE_VERIFICATION_CONTRACT=YOUR_CONTRACT_ADDRESS
REACT_APP_SELF_ENDPOINT=YOUR_CONTRACT_ADDRESS
REACT_APP_SELF_APP_NAME="IWasBored Age Verification"
REACT_APP_SELF_SCOPE="self-workshop"
```