const { ethers } = require("hardhat");

async function main() {
    console.log("📊 Checking Markets on Polygon Amoy...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Contract addresses
    const ORACLE_ADDRESS = process.env.AMOY_ORACLE || "0x...";
    const POP_TOKEN_ADDRESS = process.env.AMOY_POP_TOKEN || "0x...";
    
    if (ORACLE_ADDRESS === "0x..." || POP_TOKEN_ADDRESS === "0x...") {
        console.error("❌ Please set environment variables:");
        console.error("   AMOY_ORACLE=0x...");
        console.error("   AMOY_POP_TOKEN=0x...");
        process.exit(1);
    }
    
    try {
        // Get contract instances
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(ORACLE_ADDRESS);
        
        const ERC20 = await ethers.getContractFactory("ERC20");
        const popToken = ERC20.attach(POP_TOKEN_ADDRESS);
        
        console.log("\n🔧 Oracle Configuration");
        console.log("=======================");
        
        // Check oracle configuration
        const config = await oracle.getRandomMarketConfig();
        console.log("Auto-creation enabled:", config.autoCreateEnabled);
        console.log("Price feeds configured:", config.priceIds.length);
        console.log("Min duration:", config.minDuration.toString(), "seconds");
        console.log("Max duration:", config.maxDuration.toString(), "seconds");
        console.log("Market interval:", config.marketInterval.toString(), "seconds");
        console.log("Initial funding per market:", ethers.formatEther(config.initialFunding), "tokens");
        
        // Check oracle balances
        console.log("\n💰 Oracle Balances");
        console.log("==================");
        const oracleBalance = await popToken.balanceOf(ORACLE_ADDRESS);
        console.log("Token balance:", ethers.formatEther(oracleBalance), "tokens");
        
        const maticBalance = await ethers.provider.getBalance(ORACLE_ADDRESS);
        console.log("MATIC balance:", ethers.formatEther(maticBalance), "MATIC");
        
        // Check if can create market
        const canCreate = await oracle.canCreateRandomMarket();
        console.log("Can create new market:", canCreate);
        
        // Check user balances
        console.log("\n👤 User Account");
        console.log("===============");
        const userPopBalance = await popToken.balanceOf(deployer.address);
        console.log("Your token balance:", ethers.formatEther(userPopBalance), "tokens");
        
        const userMaticBalance = await ethers.provider.getBalance(deployer.address);
        console.log("Your MATIC balance:", ethers.formatEther(userMaticBalance), "MATIC");
        
        // Check open positions
        const openPositions = await oracle.getUserOpenPositions(deployer.address);
        console.log("Your open positions:", openPositions.length);
        
        if (openPositions.length > 0) {
            console.log("\n📈 Your Open Positions");
            console.log("======================");
            
            for (let i = 0; i < Math.min(openPositions.length, 5); i++) {
                const questionId = openPositions[i];
                console.log(`Position ${i + 1}: ${questionId}`);
                
                try {
                    const marketData = await oracle.getMarketData(questionId);
                    const endTime = new Date(Number(marketData.questionData.endTimestamp) * 1000);
                    const isExpired = Date.now() > endTime.getTime();
                    const isResolved = marketData.answerData.answerTimestamp > 0;
                    
                    console.log(`  End time: ${endTime.toLocaleString()}`);
                    console.log(`  Status: ${isExpired ? 'Expired' : 'Active'} | ${isResolved ? 'Resolved' : 'Pending'}`);
                    
                    if (marketData.probabilities.length >= 2) {
                        const prob1 = (Number(marketData.probabilities[0]) / 1e18 * 100).toFixed(1);
                        const prob2 = (Number(marketData.probabilities[1]) / 1e18 * 100).toFixed(1);
                        console.log(`  Probabilities: ${prob1}% / ${prob2}%`);
                    }
                } catch (error) {
                    console.log(`  Error fetching data: ${error.message}`);
                }
            }
            
            if (openPositions.length > 5) {
                console.log(`  ... and ${openPositions.length - 5} more positions`);
            }
        }
        
        // Check spending and redemption stats
        const userSpending = await oracle.userSpendings(deployer.address);
        const userRedeemed = await oracle.userRedeemed(deployer.address);
        
        console.log("\n📊 Your Stats");
        console.log("=============");
        console.log("Total spent:", ethers.formatEther(userSpending), "tokens");
        console.log("Total redeemed:", ethers.formatEther(userRedeemed), "tokens");
        
        if (userSpending > 0) {
            const netResult = userRedeemed - userSpending;
            const isProfit = netResult >= 0;
            console.log("Net result:", (isProfit ? "+" : "") + ethers.formatEther(netResult), "tokens", isProfit ? "📈" : "📉");
        }
        
        // Price feed information
        console.log("\n🔍 Price Feed Information");
        console.log("========================");
        
        const priceFeeds = {
            "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace": "ETH/USD",
            "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43": "BTC/USD",
            "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52": "MATIC/USD",
            "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL/USD"
        };
        
        for (const priceId of config.priceIds) {
            const feedName = priceFeeds[priceId] || "Unknown";
            try {
                const price = await oracle.getCurrentPrice(priceId);
                const formattedPrice = (Number(price.price) / 1e8).toFixed(2);
                const ageSeconds = Math.floor(Date.now() / 1000) - Number(price.publishTime);
                console.log(`${feedName}: $${formattedPrice} (${ageSeconds}s ago)`);
            } catch (error) {
                console.log(`${feedName}: Error fetching price`);
            }
        }
        
        console.log("\n💡 Available Actions");
        console.log("===================");
        
        if (canCreate) {
            console.log("🎲 Create random market: npx hardhat run scripts/create-market-amoy.js --network amoy");
        } else {
            console.log("⏳ Wait for market interval or fund oracle to create markets");
        }
        
        if (openPositions.length > 0) {
            console.log("💰 Redeem positions: npx hardhat run scripts/redeem-positions-amoy.js --network amoy");
        }
        
        if (userPopBalance > ethers.parseEther("10")) {
            console.log("🛒 Buy positions: npx hardhat run scripts/buy-position-amoy.js --network amoy");
        } else {
            console.log("🪙 Get tokens from the deployed contract owner");
        }
        
        console.log("\n🔗 Useful Links");
        console.log("===============");
        console.log("Oracle contract:", `https://amoy.polygonscan.com/address/${ORACLE_ADDRESS}`);
        console.log("Token contract:", `https://amoy.polygonscan.com/address/${POP_TOKEN_ADDRESS}`);
        console.log("PYTH Network:", "https://pyth.network/price-feeds");
        console.log("Polygon Faucet:", "https://faucet.polygon.technology/");
        
    } catch (error) {
        console.error("❌ Failed to check markets:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
