import hre from "hardhat";

async function main() {
  console.log("Deploying AgeVerification contract to Celo Sepolia...");
  
  // Check if ethers is available
  console.log("Available hre properties:", Object.keys(hre));
  
  // Access ethers through hre
  const ethers = hre.ethers;
  if (!ethers) {
    throw new Error("Ethers is not available. Make sure @nomicfoundation/hardhat-ethers is installed and imported.");
  }
  
  // Celo Sepolia Self Protocol Hub address
  const CELO_SEPOLIA_HUB = "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";
  
  // Verification configuration following Self Protocol format
  const verificationConfig = {
    olderThan: 18, // Must be 18 or older
    forbiddenCountries: ["USA"], // Following workshop format - exclude USA for compliance
    ofacEnabled: false // OFAC compliance disabled for now
  };

  console.log("Using Self Protocol Hub:", CELO_SEPOLIA_HUB);
  console.log("Verification Config:", verificationConfig);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance and network by making a call
  const balance = await deployer.provider.getBalance(deployer.address);
  const network = await deployer.provider.getNetwork();
  console.log("Network Chain ID:", network.chainId.toString());
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  // Get the contract factory
  const AgeVerification = await ethers.getContractFactory("AgeVerification");

  // Deploy the AgeVerification contract
  console.log("Deploying AgeVerification contract...");
  const ageVerification = await AgeVerification.deploy(
    CELO_SEPOLIA_HUB,
    "self-workshop", // Scope for this verification
    verificationConfig
  );

  await ageVerification.waitForDeployment();
  const contractAddress = await ageVerification.getAddress();

  console.log("✅ AgeVerification deployed to:", contractAddress);
  console.log("🔗 View on explorer:", `https://celo-sepolia.blockscout.com/address/${contractAddress}`);

  // Get the verification config ID
  const configId = await ageVerification.verificationConfigId();
  console.log("📋 Verification Config ID:", configId);

  // Save deployment info
  const deploymentInfo = {
    network: "Celo Sepolia Testnet",
    ageVerificationAddress: contractAddress,
    hubAddress: CELO_SEPOLIA_HUB,
    verificationConfigId: configId,
    scope: "self-workshop",
    explorer: `https://celo-sepolia.blockscout.com/address/${contractAddress}`,
    deployedAt: new Date().toISOString(),
    verificationConfig: verificationConfig
  };

  console.log("\n=== 🎉 Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== 📋 Next Steps ===");
  console.log("1. Update your frontend .env file:");
  console.log(`   REACT_APP_AGE_VERIFICATION_CONTRACT=${contractAddress}`);
  console.log(`   REACT_APP_SELF_ENDPOINT=${contractAddress}`);
  console.log("2. Test the verification flow in your frontend");
  console.log("3. Users can now verify their age using the Self Protocol app");

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
