const hre = require("hardhat");

async function main() {
  // Update this with your deployed contract address
  const contractAddress = "0x5e5b05e86b98ea1133cadde46b67dcbbb9f13dee";
  
  const SELF_HUB_ADDRESS = "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";
  const verificationConfig = {
    olderThan: 18,
    forbiddenCountries: ["USA"], 
    ofacEnabled: false
  };

  console.log("🔍 Attempting to verify contract on Celo Sepolia...");
  console.log("Contract Address:", contractAddress);

  try {
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
      console.log(`1. Visit: https://celo-sepolia.blockscout.com/address/${contractAddress}/contracts#address-tabs`);
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
