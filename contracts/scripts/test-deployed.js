const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing deployed contract...");
  
  const contractAddress = "0x5e5B05e86B98ea1133cADdE46B67dcBBB9f13DEe";
  
  try {
    // Get contract instance
    const AgeVerification = await hre.ethers.getContractFactory("ProofOfHuman");
    const contract = AgeVerification.attach(contractAddress);

    console.log("📍 Contract Address:", contractAddress);

    // Check if contract has code
    const code = await hre.ethers.provider.getCode(contractAddress);
    console.log("📋 Contract has code:", code !== "0x");
    
    // Test basic functions that should work even if constructor partially failed
    console.log("\n🧪 Testing contract functions...");
    
    try {
      // This should work as it's from the parent contract
      const scope = await contract.scope();
      console.log("✅ scope():", scope.toString());
    } catch (e) {
      console.log("❌ scope() failed:", e.message);
    }

    // fetch lastUserAddress
    const lastUserAddress = await contract.lastUserAddress();
    console.log("✅ lastUserAddress():", lastUserAddress);

    try {
      // This might fail if constructor didn't complete
      const configId = await contract.verificationConfigId();
      console.log("✅ verificationConfigId():", configId);
    } catch (e) {
      console.log("❌ verificationConfigId() failed:", e.message);
    }

    try {
      // This should work as it's a simple mapping
      const isVerified = await contract.isVerified("0x0000000000000000000000000000000000000000");
      console.log("✅ isVerified() for zero address:", isVerified);
    } catch (e) {
      console.log("❌ isVerified() failed:", e.message);
    }

    // Test if we can call view functions from the hub
    console.log("\n🌐 Testing Self Protocol hub connection...");
    const hubAddress = "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";
    try {
      const hubCode = await hre.ethers.provider.getCode(hubAddress);
      if (hubCode === "0x") {
        console.log("❌ Self Protocol hub has no code at this address");
      } else {
        console.log("✅ Self Protocol hub exists and has code");
      }
    } catch (e) {
      console.log("❌ Error checking hub:", e.message);
    }

  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
