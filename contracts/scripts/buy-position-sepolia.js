const { ethers } = require("hardhat");

async function main() {
    console.log("🛒 Buying position on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get addresses from environment
    const oracleAddress = process.env.SEPOLIA_ORACLE;
    const tokenAddress = process.env.SEPOLIA_TOKEN;
    
    if (!oracleAddress || !tokenAddress) {
        console.error("❌ Required environment variables not found:");
        console.log("   SEPOLIA_ORACLE:", oracleAddress || "missing");
        console.log("   SEPOLIA_TOKEN:", tokenAddress || "missing");
        console.log("💡 Please run deploy-sepolia.js first or set these in your .env file");
        process.exit(1);
    }
    
    console.log("🏭 Oracle address:", oracleAddress);
    console.log("🪙 Token address:", tokenAddress);
    
    try {
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(oracleAddress);
        
        const Token = await ethers.getContractFactory("Token");
        const token = Token.attach(tokenAddress);
        
        // Check user's token balance
        const userBalance = await token.balanceOf(deployer.address);
        console.log("💰 Your token balance:", ethers.formatEther(userBalance), "tokens");
        
        if (userBalance === 0n) {
            console.log("❌ You have no tokens to buy positions with");
            console.log("💡 Request tokens from the contract owner or get them from a faucet");
            return;
        }
        
        // Get active markets
        console.log("\n📊 Finding active markets...");
        const activeMarkets = await oracle.activeMarketIds();
        
        if (activeMarkets.length === 0) {
            console.log("❌ No active markets found");
            console.log("💡 Create a market first: npx hardhat run scripts/create-market-sepolia.js --network sepolia");
            return;
        }
        
        console.log(`Found ${activeMarkets.length} active market(s)`);
        
        // Find the first suitable market
        let selectedMarket = null;
        let selectedMarketData = null;
        
        for (let i = 0; i < activeMarkets.length; i++) {
            const questionId = activeMarkets[i];
            try {
                const marketData = await oracle.getMarketData(questionId);
                const isExpired = Date.now() >= Number(marketData.questionData.endTimestamp) * 1000;
                const isResolved = marketData.answerData.answerTimestamp > 0;
                
                if (!isExpired && !isResolved) {
                    selectedMarket = questionId;
                    selectedMarketData = marketData;
                    console.log(`\n✅ Selected Market ${i + 1}:`);
                    console.log(`   Question ID: ${questionId}`);
                    console.log(`   End Time: ${new Date(Number(marketData.questionData.endTimestamp) * 1000).toLocaleString()}`);
                    console.log(`   FPMM: ${marketData.questionData.fpmm}`);
                    break;
                } else {
                    console.log(`\n⏳ Market ${i + 1} (${isExpired ? 'Expired' : 'Active'} | ${isResolved ? 'Resolved' : 'Pending'})`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking market: ${error.message}`);
            }
        }
        
        if (!selectedMarket) {
            console.log("❌ No suitable markets found (all are expired or resolved)");
            console.log("💡 Create a new market or wait for existing ones to be active");
            return;
        }
        
        // Show market probabilities
        if (selectedMarketData.probabilities.length >= 2) {
            const prob1 = (Number(selectedMarketData.probabilities[0]) / 1e18 * 100).toFixed(1);
            const prob2 = (Number(selectedMarketData.probabilities[1]) / 1e18 * 100).toFixed(1);
            
            console.log("\n📊 Current Market Probabilities:");
            console.log(`   Price Goes Up: ${prob1}%`);
            console.log(`   Price Goes Down: ${prob2}%`);
        }
        
        // Configuration for the purchase
        const investmentAmount = ethers.parseEther("10"); // 10 tokens
        const outcomeIndex = 0; // 0 = price goes up, 1 = price goes down
        const minOutcomeTokens = 0; // Accept any amount of outcome tokens
        
        console.log("\n🛒 Purchase Configuration:");
        console.log(`   Investment: ${ethers.formatEther(investmentAmount)} tokens`);
        console.log(`   Betting on: ${outcomeIndex === 0 ? 'Price Goes Up' : 'Price Goes Down'}`);
        console.log(`   Min outcome tokens: ${minOutcomeTokens}`);
        
        // Check if user has enough balance
        if (userBalance < investmentAmount) {
            console.log(`❌ Insufficient balance. Need ${ethers.formatEther(investmentAmount)} tokens, have ${ethers.formatEther(userBalance)}`);
            return;
        }
        
        // Check remaining buy amount for this question
        const remainingBuyAmount = await oracle.getRemainingBuyAmount(selectedMarket, deployer.address);
        console.log("📊 Remaining buy amount for this market:", ethers.formatEther(remainingBuyAmount), "tokens");
        
        if (remainingBuyAmount < investmentAmount) {
            console.log(`⚠️  Investment amount (${ethers.formatEther(investmentAmount)}) exceeds remaining allowed amount (${ethers.formatEther(remainingBuyAmount)})`);
            console.log("💡 Either reduce investment amount or use a different account");
            return;
        }
        
        // Check token allowance
        const currentAllowance = await token.allowance(deployer.address, oracleAddress);
        console.log("📊 Current token allowance:", ethers.formatEther(currentAllowance), "tokens");
        
        if (currentAllowance < investmentAmount) {
            console.log("🔓 Approving token spending...");
            const approveTx = await token.approve(oracleAddress, investmentAmount);
            console.log("📤 Approval transaction sent:", approveTx.hash);
            await approveTx.wait();
            console.log("✅ Token spending approved");
        }
        
        // Execute the purchase
        console.log("\n🚀 Buying position...");
        const tx = await oracle.buyPosition(
            selectedMarket,
            outcomeIndex,
            investmentAmount,
            minOutcomeTokens,
            deployer.address
        );
        
        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Parse the buy position event
        const buyEvent = receipt.logs.find(log => {
            try {
                const parsed = oracle.interface.parseLog(log);
                return parsed.name === "BuyPosition";
            } catch {
                return false;
            }
        });
        
        if (buyEvent) {
            const parsed = oracle.interface.parseLog(buyEvent);
            const { investmentAmount, feeAmount, outcomeTokensBought } = parsed.args;
            
            console.log("\n🎉 Position Purchased Successfully!");
            console.log("===================================");
            console.log("Investment amount:", ethers.formatEther(investmentAmount), "tokens");
            console.log("Fee amount:", ethers.formatEther(feeAmount), "tokens");
            console.log("Outcome tokens received:", ethers.formatEther(outcomeTokensBought), "tokens");
            console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        } else {
            console.log("⚠️  Position purchased but could not parse event data");
        }
        
        // Check updated balances
        console.log("\n📊 Updated Balances:");
        const newTokenBalance = await token.balanceOf(deployer.address);
        console.log("Token balance:", ethers.formatEther(newTokenBalance), "tokens");
        
        const newOpenPositions = await oracle.getUserOpenPositions(deployer.address);
        console.log("Open positions:", newOpenPositions.length);
        
        const totalSpending = await oracle.userSpendings(deployer.address);
        console.log("Total spending:", ethers.formatEther(totalSpending), "tokens");
        
        console.log("\n💡 Next Steps:");
        console.log("1. Monitor your position: npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia");
        console.log("2. Wait for market to resolve");
        console.log("3. Redeem if profitable: npx hardhat run scripts/redeem-positions-sepolia.js --network sepolia");
        
    } catch (error) {
        console.error("❌ Failed to buy position:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more Sepolia ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("Insufficient allowance")) {
            console.log("💡 Solution: Approve token spending first");
        } else if (error.message.includes("Amount exceeds maximum")) {
            console.log("💡 Solution: Reduce investment amount or use different account");
        } else if (error.message.includes("Market not found")) {
            console.log("💡 Solution: Create a market first or check market ID");
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
