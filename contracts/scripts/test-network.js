import hre from "hardhat";

async function main() {
  console.log("Testing network connection...");
  console.log("Network object:", hre.network);
  console.log("Network properties:", Object.keys(hre.network));
  console.log("Available hre properties:", Object.keys(hre));
  
  try {
    const { ethers } = await import("hardhat");
    console.log("Ethers imported successfully");
    console.log("Ethers methods:", Object.keys(ethers));
    
    const signers = await ethers.getSigners();
    console.log("Number of signers:", signers.length);
    
    if (signers.length > 0) {
      console.log("First signer address:", signers[0].address);
      const balance = await signers[0].provider.getBalance(signers[0].address);
      console.log("Balance:", ethers.formatEther(balance), "CELO");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
