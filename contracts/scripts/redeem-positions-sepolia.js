const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Redeeming positions on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get oracle address from environment
    const oracleAddress = process.env.SEPOLIA_ORACLE;
    
    if (!oracleAddress) {
        console.error("❌ SEPOLIA_ORACLE address not found in environment variables");
        console.log("💡 Please run deploy-sepolia.js first or set SEPOLIA_ORACLE in your .env file");
        process.exit(1);
    }
    
    console.log("🏭 Oracle address:", oracleAddress);
    
    try {
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(oracleAddress);
        
        // Check user's open positions
        console.log("\n📊 Checking your positions...");
        const openPositions = await oracle.getUserOpenPositions(deployer.address);
        
        if (openPositions.length === 0) {
            console.log("ℹ️  You have no open positions to redeem");
            return;
        }
        
        console.log(`Found ${openPositions.length} open position(s)`);
        
        // Check which positions are resolved
        const resolvedPositions = [];
        const pendingPositions = [];
        
        for (let i = 0; i < openPositions.length; i++) {
            const questionId = openPositions[i];
            try {
                const marketData = await oracle.getMarketData(questionId);
                const isResolved = marketData.answerData.answerTimestamp > 0;
                const isExpired = Date.now() >= Number(marketData.questionData.endTimestamp) * 1000;
                
                console.log(`\nPosition ${i + 1}:`);
                console.log(`  Question ID: ${questionId}`);
                console.log(`  End Time: ${new Date(Number(marketData.questionData.endTimestamp) * 1000).toLocaleString()}`);
                console.log(`  Status: ${isExpired ? 'Expired' : 'Active'} | ${isResolved ? 'Resolved' : 'Pending'}`);
                
                if (isResolved) {
                    resolvedPositions.push(questionId);
                    console.log(`  ✅ Ready for redemption`);
                } else {
                    pendingPositions.push(questionId);
                    console.log(`  ⏳ Waiting for resolution`);
                }
            } catch (error) {
                console.log(`  ❌ Error checking position: ${error.message}`);
            }
        }
        
        if (resolvedPositions.length === 0) {
            console.log("\n⏳ No resolved positions found. Markets need to be resolved first.");
            if (pendingPositions.length > 0) {
                console.log("💡 Wait for markets to expire and be resolved, or resolve them manually");
            }
            return;
        }
        
        console.log(`\n💰 Redeeming ${resolvedPositions.length} resolved position(s)...`);
        
        // Get current balance before redemption
        const tokenAddress = process.env.SEPOLIA_TOKEN;
        let initialBalance = 0n;
        
        if (tokenAddress) {
            const Token = await ethers.getContractFactory("Token");
            const token = Token.attach(tokenAddress);
            initialBalance = await token.balanceOf(deployer.address);
            console.log("Initial balance:", ethers.formatEther(initialBalance), "tokens");
        }
        
        // Redeem positions in batches (max 5 at a time for gas efficiency)
        const batchSize = 5;
        let totalRedeemed = 0n;
        
        for (let i = 0; i < resolvedPositions.length; i += batchSize) {
            const batch = resolvedPositions.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(resolvedPositions.length / batchSize);
            
            console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} positions)...`);
            
            try {
                const tx = await oracle.redeemPositions(batch.length);
                console.log("📤 Transaction sent:", tx.hash);
                
                const receipt = await tx.wait();
                console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
                
                // Parse redemption events
                const redemptionEvents = receipt.logs.filter(log => {
                    try {
                        const parsed = oracle.interface.parseLog(log);
                        return parsed.name === "RedeemPosition";
                    } catch {
                        return false;
                    }
                }).map(log => oracle.interface.parseLog(log));
                
                let batchPayout = 0n;
                for (const event of redemptionEvents) {
                    const { totalPayout } = event.args;
                    batchPayout += totalPayout;
                    totalRedeemed += totalPayout;
                }
                
                console.log(`   Batch payout: ${ethers.formatEther(batchPayout)} tokens`);
                console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                
            } catch (error) {
                console.error(`❌ Failed to redeem batch ${batchNumber}:`, error.message);
                
                if (error.message.includes("No positions to redeem")) {
                    console.log("   💡 These positions might already be redeemed");
                } else if (error.message.includes("insufficient funds")) {
                    console.log("   💡 Need more ETH for gas fees");
                }
            }
        }
        
        // Check final balance
        if (tokenAddress) {
            const Token = await ethers.getContractFactory("Token");
            const token = Token.attach(tokenAddress);
            const finalBalance = await token.balanceOf(deployer.address);
            const actualGain = finalBalance - initialBalance;
            
            console.log("\n📊 Redemption Summary:");
            console.log("Initial balance:", ethers.formatEther(initialBalance), "tokens");
            console.log("Final balance:", ethers.formatEther(finalBalance), "tokens");
            console.log("Net gain:", ethers.formatEther(actualGain), "tokens");
            
            if (actualGain > 0) {
                console.log("🎉 Profitable redemption!");
            } else if (actualGain === 0n) {
                console.log("📊 Break-even redemption");
            } else {
                console.log("📉 Loss on redemption");
            }
        }
        
        // Check remaining positions
        const remainingPositions = await oracle.getUserOpenPositions(deployer.address);
        console.log("\nRemaining open positions:", remainingPositions.length);
        
        if (remainingPositions.length > 0) {
            console.log("💡 Some positions are still open (unresolved markets)");
        }
        
        console.log("\n💡 Next Steps:");
        console.log("1. Check your updated balance");
        console.log("2. Buy more positions: npx hardhat run scripts/buy-position-sepolia.js --network sepolia");
        console.log("3. Check remaining positions: npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia");
        
    } catch (error) {
        console.error("❌ Failed to redeem positions:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more Sepolia ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("call exception")) {
            console.log("💡 Solution: Check oracle contract address and network connection");
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
