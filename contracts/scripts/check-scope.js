const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking deployed contract scope...");
  
  // Get contract address from command line or hardcode it
  const contractAddress = "0xdC112Ab00d2667AC2663A88330C41D5882476b71";
  
  if (!contractAddress) {
    console.log("❌ Please provide contract address:");
    console.log("Usage: npx hardhat run scripts/check-scope.js --network celo-sepolia <CONTRACT_ADDRESS>");
    process.exit(1);
  }

  try {
    // Get contract instance
    const AgeVerification = await hre.ethers.getContractFactory("AgeVerification");
    const contract = AgeVerification.attach(contractAddress);

    // Check scope
    const scope = await contract.scope();
    console.log("📋 Contract Scope (numeric):", scope.toString());
    
    // Check verification config ID
    const configId = await contract.verificationConfigId();
    console.log("📋 Verification Config ID:", configId);
    
    // The scope should be a uint256 representation of the string "iwasbored"
    // Self Protocol converts string scopes to uint256 using keccak256
    const expectedScopeHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("iwasbored"));
    console.log("🎯 Expected Scope Hash:", expectedScopeHash);
    console.log("🎯 Expected Scope (uint256):", BigInt(expectedScopeHash).toString());
    
    if (scope.toString() === BigInt(expectedScopeHash).toString()) {
      console.log("✅ Scope matches expected value!");
    } else {
      console.log("❌ Scope mismatch detected!");
      console.log("💡 Contract scope:", scope.toString());
      console.log("💡 Expected scope:", BigInt(expectedScopeHash).toString());
    }

  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
    console.log("💡 Make sure the contract address is correct and deployed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
