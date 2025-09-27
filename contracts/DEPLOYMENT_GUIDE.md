# AgeVerification Contract Deployment Guide

## Overview

This guide covers deploying the AgeVerification contract to both Celo Sepolia (testnet) and Celo Mainnet using the updated deployment script.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Create .env file with your private key
   cp env.example .env
   # Edit .env and add your PRIVATE_KEY
   ```

2. **Network Configuration**
   The `hardhat.config.js` file is already configured for:
   - Celo Sepolia (testnet) - Chain ID: 11142220
   - Celo Mainnet - Chain ID: 42220

3. **Fund Your Account**
   - **Testnet**: Get CELO tokens from [Celo Faucet](https://faucet.celo.org/)
   - **Mainnet**: Ensure your account has sufficient CELO for gas fees

## Deployment Commands

### Deploy to Celo Sepolia (Testnet)
```bash
npx hardhat run scripts/deploy.js --network celo-sepolia
```

### Deploy to Celo Mainnet
```bash
npx hardhat run scripts/deploy.js --network celo-mainnet
```

## Network-Specific Configurations

| Network | Hub Address | Explorer | Faucet |
|---------|-------------|----------|---------|
| Celo Sepolia | `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74` | [BlockScout](https://celo-sepolia.blockscout.com) | [Faucet](https://faucet.celo.org/) |
| Celo Mainnet | `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF` | [BlockScout](https://celo.blockscout.com) | N/A |

## Safety Features

### Mainnet Deployment Protection
When deploying to mainnet, the script will:
1. Display a warning about real token usage
2. Show all configuration parameters
3. Wait 10 seconds for manual cancellation
4. Provide clear deployment confirmations

### Automatic Verification
The script attempts to verify contracts automatically on BlockScout. If automatic verification fails, manual verification instructions are provided.

## Contract Configuration

The deployment uses these default settings:
- **Scope**: "iwasbored"
- **Minimum Age**: 18 years
- **Forbidden Countries**: ["USA"]
- **OFAC Enabled**: false

## Post-Deployment

After successful deployment, the script provides:
1. Contract address
2. Explorer links
3. Frontend environment variables
4. Verification instructions (if needed)

## Troubleshooting

### Common Issues

1. **No PRIVATE_KEY in .env**
   - Ensure your `.env` file contains a valid private key
   - Use the format: `PRIVATE_KEY=0x...`

2. **Insufficient Balance**
   - For testnet: Get tokens from the faucet
   - For mainnet: Add CELO to your account

3. **Verification Failed**
   - Manual verification instructions are provided
   - Use the BlockScout interface with provided parameters

4. **Unsupported Network**
   - Ensure you're using `celo-sepolia` or `celo-mainnet`
   - Check your hardhat network configuration

## Frontend Integration

After deployment, add these to your frontend `.env`:
```bash
REACT_APP_AGE_VERIFICATION_CONTRACT=<deployed_contract_address>
REACT_APP_SELF_ENDPOINT=<deployed_contract_address>
REACT_APP_SELF_APP_NAME="IWasBored Age Verification"
REACT_APP_SELF_SCOPE="iwasbored"
```

## Security Considerations

### Testnet vs Mainnet
- Always test on Celo Sepolia before mainnet deployment
- Verify all parameters in the safety check for mainnet
- Consider using a fresh deployment address for mainnet

### Private Key Security
- Never commit your `.env` file
- Use hardware wallets for mainnet deployments
- Consider using separate keys for testnet and mainnet

## Support

For issues with:
- **Contract deployment**: Check Hardhat documentation
- **Self Protocol integration**: Refer to Self Protocol docs
- **Celo network**: Visit Celo developer documentation
