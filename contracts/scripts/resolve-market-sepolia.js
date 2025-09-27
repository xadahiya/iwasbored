const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Resolving market on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get oracle address from environment
    const oracleAddress = process.env.SEPOLIA_ORACLE;
    
    if (!oracleAddress) {
        console.error("❌ SEPOLIA_ORACLE address not found in environment variables");
        console.log("💡 Please run deploy-sepolia.js first or set SEPOLIA_ORACLE in your .env file");
        process.exit(1);
    }
    
    // Get market ID from environment or command line
    const marketId = process.env.MARKET_ID || process.argv[2];
    
    if (!marketId) {
        console.error("❌ Market ID not provided");
        console.log("💡 Usage: MARKET_ID=0x... npx hardhat run scripts/resolve-market-sepolia.js --network sepolia");
        console.log("💡 Or: npx hardhat run scripts/resolve-market-sepolia.js --network sepolia 0x...");
        process.exit(1);
    }
    
    console.log("🏭 Oracle address:", oracleAddress);
    console.log("🎯 Market ID:", marketId);
    
    try {
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(oracleAddress);
        
        // Check if market exists and get details
        console.log("\n📊 Checking market details...");
        let marketData;
        try {
            marketData = await oracle.getMarketData(marketId);
        } catch (error) {
            console.error("❌ Market not found or invalid market ID");
            process.exit(1);
        }
        
        const now = Math.floor(Date.now() / 1000);
        const endTime = Number(marketData.questionData.endTimestamp);
        const isExpired = now >= endTime;
        const isResolved = marketData.answerData.answerTimestamp > 0;
        
        console.log("Market Details:");
        console.log("  End Time:", new Date(endTime * 1000).toLocaleString());
        console.log("  Status:", isExpired ? "Expired" : "Active");
        console.log("  Resolved:", isResolved ? "Yes" : "No");
        console.log("  FPMM:", marketData.questionData.fpmm);
        console.log("  Price Feed:", marketData.questionData.priceFeedId);
        console.log("  Initial Price:", marketData.questionData.initialPrice.toString());
        
        if (isResolved) {
            console.log("⚠️  Market is already resolved");
            console.log("  Final Price:", marketData.questionData.finalPrice.toString());
            console.log("  Resolution Time:", new Date(Number(marketData.answerData.answerTimestamp) * 1000).toLocaleString());
            return;
        }
        
        if (!isExpired) {
            console.log("⚠️  Market has not expired yet");
            console.log("  Time remaining:", (endTime - now), "seconds");
            console.log("  Expires at:", new Date(endTime * 1000).toLocaleString());
            
            const continueAnyway = process.env.FORCE_RESOLVE === "true";
            if (!continueAnyway) {
                console.log("💡 Set FORCE_RESOLVE=true to resolve before expiration");
                return;
            } else {
                console.log("🔥 Forcing resolution before expiration...");
            }
        }
        
        // Estimate PYTH update fee
        const updateFee = ethers.parseEther("0.001");
        console.log("💰 PYTH update fee:", ethers.formatEther(updateFee), "ETH");
        
        // Check deployer's ETH balance
        const ethBalance = await ethers.provider.getBalance(deployer.address);
        console.log("💰 Your ETH balance:", ethers.formatEther(ethBalance), "ETH");
        
        if (ethBalance < updateFee) {
            console.log("❌ Insufficient ETH balance for PYTH update fee");
            console.log("💡 Get more Sepolia ETH from https://sepoliafaucet.com/");
            return;
        }
        
        // Prepare resolution
        console.log("\n🔄 Resolving market...");
        console.log("Note: This will update PYTH price feeds and determine the outcome");
        
        const answerCid = "manual-resolution"; // You could store more detailed info here
        
        const tx = await oracle.resolveMarket(
            marketId,
            [], // Empty price update data for now - in production you'd fetch from PYTH
            answerCid,
            {
                value: updateFee
            }
        );
        
        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Parse the market resolution event
        const resolveEvent = receipt.logs.find(log => {
            try {
                const parsed = oracle.interface.parseLog(log);
                return parsed.name === "MarketResolved";
            } catch {
                return false;
            }
        });
        
        if (resolveEvent) {
            const parsed = oracle.interface.parseLog(resolveEvent);
            const { 
                questionId, 
                priceFeedId, 
                initialPrice, 
                finalPrice, 
                priceWentUp, 
                payouts 
            } = parsed.args;
            
            console.log("\n🎉 Market Resolved Successfully!");
            console.log("=================================");
            console.log("Question ID:", questionId);
            console.log("Price Feed:", priceFeedId);
            console.log("Initial Price:", initialPrice.toString());
            console.log("Final Price:", finalPrice.toString());
            console.log("Price Movement:", priceWentUp ? "📈 UP" : "📉 DOWN");
            console.log("Winning Outcome:", priceWentUp ? "Price Goes Up (0)" : "Price Goes Down (1)");
            
            console.log("\nPayout Distribution:");
            for (let i = 0; i < payouts.length; i++) {
                const payout = Number(payouts[i]) / 1e18;
                console.log(`  Outcome ${i}: ${payout === 1 ? '🏆 WINNER' : '❌ LOSER'} (${payout})`);
            }
            
            console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        } else {
            console.log("⚠️  Market resolved but could not parse event data");
        }
        
        // Get updated market data
        try {
            const updatedMarketData = await oracle.getMarketData(marketId);
            const finalPrice = updatedMarketData.questionData.finalPrice;
            const initialPrice = updatedMarketData.questionData.initialPrice;
            
            console.log("\n📊 Resolution Summary:");
            console.log("Initial Price:", Number(initialPrice) / 1e8, "USD");
            console.log("Final Price:", Number(finalPrice) / 1e8, "USD");
            
            const priceChange = ((Number(finalPrice) - Number(initialPrice)) / Number(initialPrice)) * 100;
            console.log("Price Change:", priceChange.toFixed(2) + "%");
            
        } catch (error) {
            console.log("⚠️  Could not fetch updated market data:", error.message);
        }
        
        console.log("\n💡 Next Steps:");
        console.log("1. Position holders can now redeem their winnings");
        console.log("2. Run: npx hardhat run scripts/redeem-positions-sepolia.js --network sepolia");
        console.log("3. Check final positions: npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia");
        
    } catch (error) {
        console.error("❌ Failed to resolve market:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more Sepolia ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("Market still active")) {
            console.log("💡 Solution: Wait for market to expire or use FORCE_RESOLVE=true");
        } else if (error.message.includes("Market already resolved")) {
            console.log("💡 Market was already resolved");
        } else if (error.message.includes("Invalid price data")) {
            console.log("💡 Solution: Check PYTH oracle connectivity and price feed availability");
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

module.exports = { main };
