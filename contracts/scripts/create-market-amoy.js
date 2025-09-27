const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Creating Random Market on Polygon Amoy...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Contract addresses (you'll need to update these after deployment)
    const ORACLE_ADDRESS = process.env.AMOY_ORACLE || "0x..."; // Update after deployment
    
    if (ORACLE_ADDRESS === "0x...") {
        console.error("❌ Please set AMOY_ORACLE environment variable with the deployed oracle address");
        process.exit(1);
    }
    
    try {
        // Get contract instance
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(ORACLE_ADDRESS);
        
        // Check if we can create a market
        const canCreate = await oracle.canCreateRandomMarket();
        console.log("📊 Can create random market:", canCreate);
        
        if (!canCreate) {
            console.log("⚠️  Cannot create market yet. Possible reasons:");
            console.log("   - Market interval not elapsed");
            console.log("   - Insufficient oracle funding");
            console.log("   - Auto-creation disabled");
            
            const config = await oracle.getRandomMarketConfig();
            console.log("   Auto-creation enabled:", config.autoCreateEnabled);
            console.log("   Market interval:", config.marketInterval.toString(), "seconds");
            
            return;
        }
        
        // Estimate gas and fees
        console.log("⛽ Estimating costs...");
        
        // PYTH update fee (usually very small)
        const updateFee = ethers.parseEther("0.001"); // Conservative estimate
        
        console.log("💰 PYTH update fee:", ethers.formatEther(updateFee), "MATIC");
        
        // Create the market
        console.log("🚀 Creating random market...");
        const tx = await oracle.createRandomMarket([], { 
            value: updateFee,
            gasLimit: 500000 // Conservative gas limit
        });
        
        console.log("⏳ Transaction submitted:", tx.hash);
        console.log("🔗 View on explorer: https://amoy.polygonscan.com/tx/" + tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Parse the market creation event
        const marketEvent = receipt.logs.find(log => {
            try {
                const parsed = oracle.interface.parseLog(log);
                return parsed.name === "RandomMarketCreated";
            } catch {
                return false;
            }
        });
        
        if (marketEvent) {
            const parsed = oracle.interface.parseLog(marketEvent);
            const { questionId, priceId, targetPrice, endTimestamp, fpmmAddress } = parsed.args;
            
            console.log("\n🎉 Random Market Created Successfully!");
            console.log("=====================================");
            console.log("Question ID:", questionId);
            console.log("Price Feed ID:", priceId);
            console.log("Target Price:", targetPrice.toString());
            console.log("End Time:", new Date(Number(endTimestamp) * 1000).toLocaleString());
            console.log("FPMM Address:", fpmmAddress);
            console.log("🔗 FPMM on explorer: https://amoy.polygonscan.com/address/" + fpmmAddress);
            
            // Get human-readable price feed name
            const priceFeeds = {
                "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace": "ETH/USD",
                "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43": "BTC/USD",
                "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52": "MATIC/USD",
                "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL/USD"
            };
            
            const feedName = priceFeeds[priceId] || "Unknown";
            console.log("Asset:", feedName);
            
            // Format target price (PYTH prices have 8 decimals)
            const formattedTargetPrice = (Number(targetPrice) / 1e8).toFixed(2);
            console.log("Target Price:", "$" + formattedTargetPrice);
            
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
            console.log("npx hardhat run scripts/buy-position-amoy.js --network amoy");
            console.log("npx hardhat run scripts/resolve-market-amoy.js --network amoy");
            
        } else {
            console.log("⚠️  Market created but could not parse event data");
        }
        
    } catch (error) {
        console.error("❌ Failed to create market:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more MATIC from https://faucet.polygon.technology/");
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
