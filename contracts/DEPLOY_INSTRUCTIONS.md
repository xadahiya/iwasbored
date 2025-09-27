# Quick Deployment Instructions for Celo Sepolia

## The Issue
There are compatibility issues between Hardhat 3.x (ES modules) and the ethers plugin versions. Here's a simple solution:

## Solution: Use Hardhat Console for Deployment

1. **Set up your .env file:**
   ```bash
   # Copy template and edit
   cp env.example .env
   
   # Add your private key (get some Celo Sepolia testnet tokens first)
   # Visit: https://faucet.celo.org/
   echo "PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE" >> .env
   ```

2. **Start Hardhat console on Celo Sepolia:**
   ```bash
   npx hardhat console --network celo-sepolia
   ```

3. **Deploy manually in the console:**
   ```javascript
   // In the Hardhat console, run these commands one by one:
   
   // Get contract factory
   const AgeVerification = await ethers.getContractFactory("AgeVerification");
   
   // Set up deployment parameters
   const CELO_SEPOLIA_HUB = "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";
   const scope = "iwasbored-age-verification";
   const verificationConfig = {
     olderThan: 18,
     forbiddenCountries: ["USA"],
     ofacEnabled: false
   };
   
   // Deploy the contract
   console.log("Deploying contract...");
   const ageVerification = await AgeVerification.deploy(
     CELO_SEPOLIA_HUB,
     scope,
     verificationConfig
   );
   
   // Wait for deployment
   await ageVerification.waitForDeployment();
   const address = await ageVerification.getAddress();
   
   console.log("✅ AgeVerification deployed to:", address);
   console.log("🔗 View on explorer:", \`https://celo-sepolia.blockscout.com/address/\${address}\`);
   
   // Get verification config ID
   const configId = await ageVerification.verificationConfigId();
   console.log("📋 Verification Config ID:", configId);
   
   // Exit console with Ctrl+C
   ```

4. **Update your frontend .env:**
   ```bash
   cd ../frontend
   echo "REACT_APP_AGE_VERIFICATION_CONTRACT=YOUR_DEPLOYED_ADDRESS" >> .env
   echo "REACT_APP_SELF_ENDPOINT=YOUR_DEPLOYED_ADDRESS" >> .env
   echo "REACT_APP_SELF_APP_NAME=IWasBored Age Verification" >> .env
   echo "REACT_APP_SELF_SCOPE=iwasbored-age-verification" >> .env
   ```

## Alternative: Use Remix IDE

If the console doesn't work, you can also deploy using Remix IDE:

1. Go to https://remix.ethereum.org/
2. Create a new file and paste your contract code
3. Compile with Solidity 0.8.28
4. Connect to Celo Sepolia network using MetaMask
5. Deploy with these parameters:
   - `identityVerificationHubV2Address`: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
   - `scope`: `"iwasbored-age-verification"`
   - `_verificationConfig`: `[18, ["USA"], false]`

## Required for Testing

1. **Get Celo Sepolia tokens:**
   - Visit: https://faucet.celo.org/
   - Connect your wallet
   - Request testnet CELO

2. **Download Self Protocol app:**
   - iOS: https://apps.apple.com/app/self-protocol/
   - Android: https://play.google.com/store/apps/details?id=com.self.app

3. **Test the verification flow:**
   - Users connect wallet in your frontend
   - Get redirected to age verification page
   - Scan QR code with Self Protocol app
   - Complete government ID verification
   - Return to your app with verified status

## Network Details

- **Network**: Celo Sepolia Testnet  
- **RPC**: https://forno.celo-sepolia.celo-testnet.org
- **Chain ID**: 11142220
- **Explorer**: https://celo-sepolia.blockscout.com/
- **Self Protocol Hub**: 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74
- **Faucet**: https://faucet.celo.org/
