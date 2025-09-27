const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Creating Random Market on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Contract addresses (you'll need to update these after deployment)
    const ORACLE_ADDRESS = process.env.SEPOLIA_ORACLE || "0x..."; // Update after deployment
    
    if (ORACLE_ADDRESS === "0x...") {
        console.error("❌ Please set SEPOLIA_ORACLE environment variable with the deployed oracle address");
        process.exit(1);
    }
    
    try {
        // Get contract instance
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(ORACLE_ADDRESS);
        
        // Check oracle configuration
        try {
            const config = await oracle.getMarketConfig();
            console.log("📊 Oracle Configuration:");
            console.log("   Price feeds available:", config.priceIds.length);
            console.log("   Initial funding:", ethers.formatEther(config.initialFunding), "tokens");
        } catch (error) {
            console.log("⚠️  Could not fetch oracle configuration:", error.message);
        }
        
        // Estimate gas and fees
        console.log("⛽ Estimating costs...");
        
        // PYTH update fee (usually very small)
        const updateFee = ethers.parseEther("0.001"); // Conservative estimate
        
        console.log("💰 PYTH update fee:", ethers.formatEther(updateFee), "ETH");
        
        // Create the market
        console.log("🚀 Creating market...");
        
        // Generate a unique question ID
        const questionId = ethers.keccak256(ethers.toUtf8Bytes(`market-${Date.now()}`));
        const endTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        const tx = await oracle.createMarket(questionId, endTimestamp, [], { 
            value: updateFee
        });
        
        console.log("⏳ Transaction submitted:", tx.hash);
        console.log("🔗 View on explorer: https://sepolia.etherscan.io/tx/" + tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Parse the market creation event
        const marketEvent = receipt.logs.find(log => {
            try {
                const parsed = oracle.interface.parseLog(log);
                return parsed.name === "MarketCreated";
            } catch {
                return false;
            }
        });
        
        if (marketEvent) {
            const parsed = oracle.interface.parseLog(marketEvent);
            const { questionId, priceId, initialPrice, endTimestamp, fpmmAddress } = parsed.args;
            
            console.log("\n🎉 Market Created Successfully!");
            console.log("===============================");
            console.log("Question ID:", questionId);
            console.log("Price Feed ID:", priceId);
            console.log("Initial Price:", initialPrice.toString());
            console.log("End Time:", new Date(Number(endTimestamp) * 1000).toLocaleString());
            console.log("FPMM Address:", fpmmAddress);
            console.log("🔗 FPMM on explorer: https://sepolia.etherscan.io/address/" + fpmmAddress);
            
            // Get human-readable price feed name
            const priceFeeds = {
                "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace": "ETH/USD",
                "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43": "BTC/USD",
                "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a": "USDC/USD",
                "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL/USD"
            };
            
            const feedName = priceFeeds[priceId] || "Unknown";
            console.log("Asset:", feedName);
            
            // Format initial price (PYTH prices have 8 decimals)
            const formattedInitialPrice = (Number(initialPrice) / 1e8).toFixed(2);
            console.log("Initial Price:", "$" + formattedInitialPrice);
            
            // Get market probabilities
            try {
                const marketData = await oracle.getMarketData(questionId);
                const prob1 = (Number(marketData.probabilities[0]) / 1e18 * 100).toFixed(1);
                const prob2 = (Number(marketData.probabilities[1]) / 1e18 * 100).toFixed(1);
                
                console.log("\n📊 Current Probabilities:");
                console.log("Target Reached:", prob1 + "%");
                console.log("Target NOT Reached:", prob2 + "%");
            } catch (error) {
                console.log("⚠️  Could not fetch market probabilities:", error.message);
            }
            
            console.log("\n🎯 Next Steps:");
            console.log("1. Users can now buy positions in this market");
            console.log("2. Market will auto-resolve when it expires");
            console.log("3. Winners can redeem their positions for tokens");
            
            console.log("\n💡 Test Commands:");
            console.log(`export MARKET_ID=${questionId}`);
            console.log("npx hardhat run scripts/buy-position-sepolia.js --network sepolia");
            console.log("npx hardhat run scripts/resolve-market-sepolia.js --network sepolia");
            
        } else {
            console.log("⚠️  Market created but could not parse event data");
        }
        
    } catch (error) {
        console.error("❌ Failed to create market:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("Market interval not elapsed")) {
            console.log("💡 Solution: Wait for the market interval to pass");
        } else if (error.message.includes("Random market creation is disabled")) {
            console.log("💡 Solution: Enable auto-creation in the oracle configuration");
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
