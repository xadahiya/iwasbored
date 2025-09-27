const { ethers } = require("hardhat");

async function main() {
    console.log("📊 Checking Markets on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Contract addresses
    const ORACLE_ADDRESS = process.env.SEPOLIA_ORACLE || "0x...";
    const POP_TOKEN_ADDRESS = process.env.SEPOLIA_TOKEN || "0x...";
    
    if (ORACLE_ADDRESS === "0x..." || POP_TOKEN_ADDRESS === "0x...") {
        console.error("❌ Please set environment variables:");
        console.error("   SEPOLIA_ORACLE=0x...");
        console.error("   SEPOLIA_TOKEN=0x...");
        process.exit(1);
    }
    
    try {
        // Get contract instances
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(ORACLE_ADDRESS);
        
        const popToken = await ethers.getContractAt("Token", POP_TOKEN_ADDRESS);
        
        console.log("\n🔧 Oracle Configuration");
        console.log("=======================");
        
        // Check oracle configuration
        const config = await oracle.getMarketConfig();
        console.log("Price feeds configured:", config.priceIds.length);
        console.log("Initial funding per market:", ethers.formatEther(config.initialFunding), "tokens");
        
        // Check oracle balances
        console.log("\n💰 Oracle Balances");
        console.log("==================");
        const oracleBalance = await popToken.balanceOf(ORACLE_ADDRESS);
        console.log("Token balance:", ethers.formatEther(oracleBalance), "tokens");
        
        const ethBalance = await ethers.provider.getBalance(ORACLE_ADDRESS);
        console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");
        
        // Check last market time
        try {
            const lastMarketTime = await oracle.lastMarketTime();
            console.log("Last market created:", new Date(Number(lastMarketTime) * 1000).toLocaleString());
        } catch (error) {
            console.log("Could not fetch last market time:", error.message);
        }
        
        // Check user balances
        console.log("\n👤 User Account");
        console.log("===============");
        const userPopBalance = await popToken.balanceOf(deployer.address);
        console.log("Your token balance:", ethers.formatEther(userPopBalance), "tokens");
        
        const userEthBalance = await ethers.provider.getBalance(deployer.address);
        console.log("Your ETH balance:", ethers.formatEther(userEthBalance), "ETH");
        
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
            "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a": "USDC/USD",
            "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL/USD"
        };
        
        for (const priceId of config.priceIds) {
            const feedName = priceFeeds[priceId] || "Unknown";
            try {
                console.log(`Fetching price for ${feedName} (${priceId})...`);
                const price = await oracle.getCurrentPrice(priceId);
                const formattedPrice = (Number(price.price) / 1e8).toFixed(2);
                const ageSeconds = Math.floor(Date.now() / 1000) - Number(price.publishTime);
                console.log(`${feedName}: $${formattedPrice} (${ageSeconds}s ago)`);
            } catch (error) {
                console.log(`${feedName}: Error fetching price - ${error.message}`);
                console.log(`   Price ID: ${priceId}`);
                
                // Try to get more details about the error
                if (error.message.includes("revert")) {
                    console.log(`   This might be a contract call revert - check if PYTH oracle is properly configured`);
                } else if (error.message.includes("network")) {
                    console.log(`   This might be a network connectivity issue`);
                } else {
                    console.log(`   Raw error: ${error}`);
                }
            }
        }
        
        // Additional PYTH oracle debugging
        console.log("\n🔍 PYTH Oracle Debugging");
        console.log("========================");
        
        try {
            // Check if oracle has the PYTH oracle address set
            const pythOracleAddress = await oracle.pythOracle();
            console.log("PYTH Oracle Address:", pythOracleAddress);
            
            // Check if it matches the expected Sepolia address
            const expectedPythAddress = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";
            if (pythOracleAddress.toLowerCase() === expectedPythAddress.toLowerCase()) {
                console.log("✅ PYTH Oracle address is correct for Sepolia");
            } else {
                console.log("⚠️  PYTH Oracle address doesn't match expected Sepolia address");
                console.log("   Expected:", expectedPythAddress);
                console.log("   Actual:  ", pythOracleAddress);
            }
            
        } catch (error) {
            console.log("❌ Could not fetch PYTH oracle address:", error.message);
        }
        
        // Try to call PYTH oracle directly
        try {
            console.log("\n🔄 Testing Direct PYTH Oracle Call");
            console.log("==================================");
            
            const pythOracleAddress = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";
            const pythOracle = await ethers.getContractAt([
                "function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
                "function getPriceUnsafe(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
                "function getPriceNoOlderThan(bytes32 id, uint age) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)"
            ], pythOracleAddress);
            
            // Try to get ETH/USD price directly from PYTH
            const ethPriceId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
            console.log("Attempting direct PYTH call for ETH/USD...");
            
            try {
                const priceUnsafe = await pythOracle.getPriceNoOlderThan(ethPriceId, 100000);
                console.log("✅ Direct PYTH call successful!");
                const price = Number(priceUnsafe.price) * Math.pow(10, Number(priceUnsafe.expo));
                console.log(`   Price: $${price.toFixed(2)}`);
                console.log(`   Confidence: ${priceUnsafe.conf.toString()}`);
                console.log(`   Expo: ${priceUnsafe.expo.toString()}`);
                console.log(`   Publish Time: ${new Date(Number(priceUnsafe.publishTime) * 1000).toLocaleString()}`);
                
            } catch (directError) {
                console.log("❌ Direct PYTH call failed:", directError.message);
                console.log("   This suggests the PYTH oracle on Sepolia might not have this price feed");
            }
            
        } catch (setupError) {
            console.log("❌ Could not set up direct PYTH oracle test:", setupError.message);
        }
        
        console.log("\n💡 Available Actions");
        console.log("===================");
        
        console.log("🎲 Create market: npx hardhat run scripts/create-market-sepolia.js --network sepolia");
        
        if (openPositions.length > 0) {
            console.log("💰 Redeem positions: npx hardhat run scripts/redeem-positions-sepolia.js --network sepolia");
        }
        
        if (userPopBalance > ethers.parseEther("10")) {
            console.log("🛒 Buy positions: npx hardhat run scripts/buy-position-sepolia.js --network sepolia");
        } else {
            console.log("🪙 Get tokens from the deployed contract owner");
        }
        
        console.log("\n🔗 Useful Links");
        console.log("===============");
        console.log("Oracle contract:", `https://sepolia.etherscan.io/address/${ORACLE_ADDRESS}`);
        console.log("Token contract:", `https://sepolia.etherscan.io/address/${POP_TOKEN_ADDRESS}`);
        console.log("PYTH Network:", "https://pyth.network/price-feeds");
        console.log("Sepolia Faucet:", "https://sepoliafaucet.com/");
        
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
