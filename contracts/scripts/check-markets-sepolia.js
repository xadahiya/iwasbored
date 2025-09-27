const { ethers } = require("hardhat");

async function main() {
    console.log("📊 Checking markets on Ethereum Sepolia...");
    
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
        
        // Get oracle configuration
        console.log("\n🔧 Oracle Configuration:");
        try {
            const config = await oracle.getMarketConfig();
            console.log("Initial Funding:", ethers.formatEther(config.initialFunding), "tokens");
            console.log("Price Feed Count:", config.priceIds.length);
        } catch (error) {
            console.log("Could not fetch oracle config:", error.message);
        }
        
        // Check active markets
        console.log("\n📈 Active Markets:");
        try {
            const activeMarkets = await oracle.activeMarketIds();
            
            if (activeMarkets.length === 0) {
                console.log("No active markets found");
            } else {
                console.log(`Found ${activeMarkets.length} active market(s)`);
                for (let i = 0; i < Math.min(activeMarkets.length, 5); i++) {
                    const questionId = activeMarkets[i];
                    console.log(`\nMarket ${i + 1}:`);
                    console.log("  Question ID:", questionId.toString());
                    
                    try {
                        const marketData = await oracle.getMarketData(questionId);
                        console.log("  End Time:", new Date(Number(marketData.questionData.endTimestamp) * 1000).toLocaleString());
                        console.log("  Status:", marketData.answerData.answerTimestamp > 0 ? "Resolved" : "Active");
                        console.log("  FPMM:", marketData.questionData.fpmm);
                    } catch (marketError) {
                        console.log("  Error fetching market data:", marketError.message);
                    }
                }
                if (activeMarkets.length > 5) {
                    console.log(`  ... and ${activeMarkets.length - 5} more markets`);
                }
            }
        } catch (error) {
            console.log("Could not fetch active markets. Error:", error.message);
        }
        
        // Check oracle balance
        console.log("\n💰 Oracle Token Balance:");
        try {
            const tokenAddress = process.env.SEPOLIA_TOKEN;
            if (tokenAddress) {
                const Token = await ethers.getContractFactory("Token");
                const token = Token.attach(tokenAddress);
                const balance = await token.balanceOf(oracleAddress);
                console.log("Token Balance:", ethers.formatEther(balance), "tokens");
            } else {
                console.log("Token address not found in environment");
            }
        } catch (error) {
            console.log("Could not fetch token balance:", error.message);
        }
        
        // Check ETH balance for PYTH fees
        const ethBalance = await ethers.provider.getBalance(oracleAddress);
        console.log("ETH Balance:", ethers.formatEther(ethBalance), "ETH");
        
        console.log("\n🔗 Useful Links:");
        console.log(`Oracle on Etherscan: https://sepolia.etherscan.io/address/${oracleAddress}`);
        if (process.env.SEPOLIA_TOKEN) {
            console.log(`Token on Etherscan: https://sepolia.etherscan.io/address/${process.env.SEPOLIA_TOKEN}`);
        }
        
    } catch (error) {
        console.error("❌ Failed to check markets:", error.message);
        
        if (error.message.includes("call revert")) {
            console.log("💡 The oracle contract might not be deployed or the address is incorrect");
        }
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main };
