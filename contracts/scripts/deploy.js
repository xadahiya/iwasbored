const hre = require("hardhat");

/**
 * Multi-network deployment script for AgeVerification contract
 * 
 * Supports:
 * - Celo Sepolia (testnet): npx hardhat run scripts/deploy.js --network celo-sepolia
 * - Celo Mainnet: npx hardhat run scripts/deploy.js --network celo-mainnet
 * 
 * Features:
 * - Network detection and appropriate hub addresses
 * - Safety checks for mainnet deployment
 * - Network-specific explorer URLs and instructions
 * - Automatic verification attempts
 */
async function main() {
  // Get the current network information
  const network = hre.network.name;
  const chainId = await hre.ethers.provider.getNetwork().then(n => n.chainId);
  
  console.log(`🚀 Deploying AgeVerification contract to ${network} (Chain ID: ${chainId})...`);
  
  // Self Protocol Hub addresses for different networks
  const HUB_ADDRESSES = {
    "celo-sepolia": "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74",
    "celo-mainnet": "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF"
  };
  
  // Network configurations
  const NETWORK_CONFIGS = {
    "celo-sepolia": {
      name: "Celo Sepolia",
      explorerUrl: "https://celo-sepolia.blockscout.com",
      faucetUrl: "https://faucet.celo.org/",
      isTestnet: true
    },
    "celo-mainnet": {
      name: "Celo Mainnet", 
      explorerUrl: "https://celo.blockscout.com",
      faucetUrl: null,
      isTestnet: false
    }
  };
  
  // Age verification configuration
  const verificationConfig = {
    olderThan: 18,
    forbiddenCountries: ["USA"], 
    ofacEnabled: false
  };

  const scopeString = "self-workshop";
  
  const SELF_HUB_ADDRESS = HUB_ADDRESSES[network];
  const networkConfig = NETWORK_CONFIGS[network];
  
  if (!SELF_HUB_ADDRESS || SELF_HUB_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("❌ No Self Protocol Hub address configured for this network!");
    console.log("💡 Please update the HUB_ADDRESSES object in the deploy script");
    console.log("💡 You can find the correct address in the Self Protocol documentation");
    process.exit(1);
  }
  
  if (!networkConfig) {
    console.log("❌ Unsupported network:", network);
    console.log("💡 Supported networks: celo-sepolia, celo-mainnet");
    process.exit(1);
  }

  // Safety check for mainnet deployment
  if (!networkConfig.isTestnet) {
    console.log("⚠️  MAINNET DEPLOYMENT DETECTED!");
    console.log("🚨 This will deploy to Celo Mainnet using real CELO tokens.");
    console.log("📋 Please confirm the following:");
    console.log(`   - Hub Address: ${SELF_HUB_ADDRESS}`);
    console.log(`   - Scope: "${scopeString}"`);
    console.log(`   - Age Requirement: ${verificationConfig.olderThan}`);
    console.log(`   - Forbidden Countries: ${JSON.stringify(verificationConfig.forbiddenCountries)}`);
    console.log("💡 Press Ctrl+C to cancel, or wait 10 seconds to continue...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log("🚀 Proceeding with mainnet deployment...");
  }

  // Get deployer account
  const signers = await hre.ethers.getSigners();
  
  if (signers.length === 0) {
    console.log("❌ No signers found!");
    console.log("💡 Make sure PRIVATE_KEY is set in your .env file");
    if (networkConfig.isTestnet && networkConfig.faucetUrl) {
      console.log(`💡 Get testnet tokens from: ${networkConfig.faucetUrl}`);
    } else {
      console.log("💡 Ensure your account has sufficient CELO tokens for mainnet deployment");
    }
    process.exit(1);
  }
  
  const [deployer] = signers;
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");

  if (balance === 0n) {
    console.log("❌ Account has no CELO tokens!");
    if (networkConfig.isTestnet && networkConfig.faucetUrl) {
      console.log(`💡 Get testnet tokens from: ${networkConfig.faucetUrl}`);
    } else {
      console.log("💡 Ensure your account has sufficient CELO tokens for mainnet deployment");
      console.log("💡 Consider using a DEX or centralized exchange to acquire CELO");
    }
    process.exit(1);
  }

  // Deploy the contract
  console.log("⏳ Deploying AgeVerification contract...");
  const expectedScopeHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(scopeString));
  console.log("🔑 Deploying with scope string:", scopeString);
  console.log(" hashed to:", expectedScopeHash);

  const AgeVerification = await hre.ethers.getContractFactory("AgeVerification");
  const ageVerification = await AgeVerification.deploy(
    SELF_HUB_ADDRESS,
    scopeString,
    verificationConfig
  );

  await ageVerification.waitForDeployment();
  const contractAddress = await ageVerification.getAddress();

  console.log("✅ AgeVerification deployed to:", contractAddress);
  console.log(`🔗 View on ${networkConfig.name} explorer:`);
  console.log(`   ${networkConfig.explorerUrl}/address/${contractAddress}`);

  // Wait a moment for the contract to be fully available
  console.log("⏳ Waiting for contract to be ready...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get verification config ID
  try {
    const configId = await ageVerification.verificationConfigId();
    console.log("📋 Verification Config ID:", configId);
  } catch (error) {
    console.log("⚠️ Could not read verificationConfigId - this is expected if Self Protocol hub is not responding");
    console.log("💡 The contract is still deployed and functional for frontend use");
    
    // Try to check if the basic contract functions work
    try {
      const scope = await ageVerification.scope();
      console.log("📋 Contract scope (numeric):", scope.toString());
    } catch (scopeError) {
      console.log("⚠️ Basic contract functions also failing:", scopeError.message);
    }
  }

  // Manual verification instructions (BlockScout verification can be tricky with Hardhat)
  console.log("\n📋 Manual Verification Instructions:");
  console.log(`To verify your contract on ${networkConfig.name} BlockScout:`);
  console.log(`1. Visit: ${networkConfig.explorerUrl}/address/${contractAddress}/contracts#address-tabs`);
  console.log("2. Click 'Verify & Publish'");
  console.log("3. Select 'Via Standard Input JSON'");
  console.log("4. Use these settings:");
  console.log("   - Compiler: 0.8.28");
  console.log("   - Optimization: Yes (200 runs)");
  console.log("   - Contract Name: AgeVerification");
  console.log("5. Upload the contract source code from contracts/AgeVerification.sol");
  console.log("6. Constructor Arguments (ABI-encoded):");
  console.log(`   - Hub Address: ${SELF_HUB_ADDRESS}`);
  console.log(`   - Scope: "self-workshop"`);
  console.log(`   - Config: {"olderThan": 18, "forbiddenCountries": ["USA"], "ofacEnabled": false}`);
  
  try {
    // sleep for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        SELF_HUB_ADDRESS,
        "self-workshop",
        verificationConfig
      ]
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log("❌ Verification failed:", error.message);
      
      console.log("\n📋 Manual Verification Steps:");
      console.log(`1. Visit: ${networkConfig.explorerUrl}/address/${contractAddress}/contracts#address-tabs`);
      console.log("2. Click 'Verify & Publish'");
      console.log("3. Select 'Via flattened source code'");
      console.log("4. Settings:");
      console.log("   - Contract Name: AgeVerification");
      console.log("   - Compiler: 0.8.28");
      console.log("   - Optimization: Yes");
      console.log("   - Runs: 200");
      console.log("5. Copy and paste the flattened source code");
      console.log("6. Constructor Arguments:");
      console.log(`   - ${SELF_HUB_ADDRESS}`);
      console.log(`   - "self-workshop"`);
      console.log(`   - Tuple: (18,["USA"],false)`);
    }
  }

  console.log("\n🎯 Frontend Configuration:");
  console.log("Add these to your frontend .env file:");
  console.log(`REACT_APP_AGE_VERIFICATION_CONTRACT=${contractAddress}`);
  console.log(`REACT_APP_SELF_ENDPOINT=${contractAddress}`);
  console.log(`REACT_APP_SELF_APP_NAME="IWasBored Age Verification"`);
  console.log(`REACT_APP_SELF_SCOPE="self-workshop"`);

  console.log("\n📌 Deployment Commands:");
  console.log("To deploy to Celo Sepolia (testnet):");
  console.log("  npx hardhat run scripts/deploy.js --network celo-sepolia");
  console.log("\nTo deploy to Celo Mainnet:");
  console.log("  npx hardhat run scripts/deploy.js --network celo-mainnet");
  console.log("\n⚠️  Remember to:");
  if (networkConfig.isTestnet) {
    console.log("- Get testnet tokens from the faucet before deploying");
    console.log("- Test thoroughly before moving to mainnet");
  } else {
    console.log("- Double-check your contract code before mainnet deployment");
    console.log("- Ensure you have sufficient CELO for gas fees");
    console.log("- Consider deploying to testnet first for testing");
  }

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });