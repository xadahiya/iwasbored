const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing deployed SimplePredictionsOracle contract...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get oracle address from environment or provide default
    const oracleAddress = process.env.SEPOLIA_ORACLE || "0x...";
    
    if (oracleAddress === "0x...") {
        console.error("❌ Please set SEPOLIA_ORACLE environment variable");
        console.log("💡 Use: export SEPOLIA_ORACLE=0xYourOracleAddress");
        process.exit(1);
    }
    
    console.log("📍 Oracle Address:", oracleAddress);
    
    try {
        // Get contract instance
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = Oracle.attach(oracleAddress);
        
        // Check if contract has code
        const code = await ethers.provider.getCode(oracleAddress);
        console.log("📋 Contract has code:", code !== "0x");
        
        if (code === "0x") {
            console.log("❌ No contract code found at this address!");
            process.exit(1);
        }
        
        console.log("\n🧪 Testing Contract Functions");
        console.log("=============================");
        
        // Test basic configuration functions
        try {
            const config = await oracle.getMarketConfig();
            console.log("✅ getMarketConfig():");
            console.log("   Price feeds:", config.priceIds.length);
            console.log("   Initial funding:", ethers.formatEther(config.initialFunding), "tokens");
        } catch (e) {
            console.log("❌ getMarketConfig() failed:", e.message);
        }
        
        try {
            const lastMarketTime = await oracle.lastMarketTime();
            console.log("✅ lastMarketTime():", new Date(Number(lastMarketTime) * 1000).toLocaleString());
        } catch (e) {
            console.log("❌ lastMarketTime() failed:", e.message);
        }
        
        try {
            const activeMarkets = await oracle.activeMarketIds();
            console.log("✅ activeMarketIds():", activeMarkets.length, "active markets");
        } catch (e) {
            console.log("❌ activeMarketIds() failed:", e.message);
        }
        
        try {
            const pythOracle = await oracle.pythOracle();
            console.log("✅ pythOracle():", pythOracle);
        } catch (e) {
            console.log("❌ pythOracle() failed:", e.message);
        }
        
        // Test user-related functions
        console.log("\n👤 Testing User Functions");
        console.log("=========================");
        
        try {
            const openPositions = await oracle.getUserOpenPositions(deployer.address);
            console.log("✅ getUserOpenPositions():", openPositions.length, "positions");
        } catch (e) {
            console.log("❌ getUserOpenPositions() failed:", e.message);
        }
        
        try {
            const spending = await oracle.userSpendings(deployer.address);
            console.log("✅ userSpendings():", ethers.formatEther(spending), "tokens");
        } catch (e) {
            console.log("❌ userSpendings() failed:", e.message);
        }
        
        try {
            const redeemed = await oracle.userRedeemed(deployer.address);
            console.log("✅ userRedeemed():", ethers.formatEther(redeemed), "tokens");
        } catch (e) {
            console.log("❌ userRedeemed() failed:", e.message);
        }
        
        // Test token balances
        console.log("\n💰 Testing Balances");
        console.log("===================");
        
        try {
            const tokenAddress = process.env.SEPOLIA_TOKEN;
            if (tokenAddress) {
                const Token = await ethers.getContractFactory("Token");
                const token = Token.attach(tokenAddress);
                
                const oracleBalance = await token.balanceOf(oracleAddress);
                console.log("✅ Oracle token balance:", ethers.formatEther(oracleBalance), "tokens");
                
                const userBalance = await token.balanceOf(deployer.address);
                console.log("✅ Your token balance:", ethers.formatEther(userBalance), "tokens");
            } else {
                console.log("⚠️  SEPOLIA_TOKEN not set, skipping token balance checks");
            }
        } catch (e) {
            console.log("❌ Token balance check failed:", e.message);
        }
        
        const ethBalance = await ethers.provider.getBalance(oracleAddress);
        console.log("✅ Oracle ETH balance:", ethers.formatEther(ethBalance), "ETH");
        
        // Test PYTH integration
        console.log("\n🔍 Testing PYTH Integration");
        console.log("===========================");
        
        try {
            const pythOracleAddress = await oracle.pythOracle();
            const expectedAddress = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21"; // Sepolia PYTH
            
            if (pythOracleAddress.toLowerCase() === expectedAddress.toLowerCase()) {
                console.log("✅ PYTH oracle address is correct for Sepolia");
            } else {
                console.log("⚠️  PYTH oracle address mismatch:");
                console.log("   Expected:", expectedAddress);
                console.log("   Actual:", pythOracleAddress);
            }
        } catch (e) {
            console.log("❌ PYTH oracle check failed:", e.message);
        }
        
        // Test price feed functionality (if configured)
        try {
            const config = await oracle.getMarketConfig();
            if (config.priceIds.length > 0) {
                console.log("✅ Testing price feed access...");
                const priceId = config.priceIds[0];
                
                try {
                    const currentPrice = await oracle.getCurrentPrice(priceId);
                    console.log("✅ getCurrentPrice() successful:");
                    console.log("   Price:", currentPrice.price.toString());
                    console.log("   Publish time:", new Date(Number(currentPrice.publishTime) * 1000).toLocaleString());
                } catch (priceError) {
                    console.log("⚠️  getCurrentPrice() failed:", priceError.message);
                    console.log("   This might be normal if prices need updating");
                }
            } else {
                console.log("⚠️  No price feeds configured");
            }
        } catch (e) {
            console.log("❌ Price feed test failed:", e.message);
        }
        
        console.log("\n📊 Contract Health Summary");
        console.log("==========================");
        
        // Count working functions
        const tests = [
            "getMarketConfig", "lastMarketTime", "activeMarketIds", "pythOracle",
            "getUserOpenPositions", "userSpendings", "userRedeemed"
        ];
        
        let workingCount = 0;
        for (const test of tests) {
            try {
                switch(test) {
                    case "getMarketConfig":
                        await oracle.getMarketConfig();
                        break;
                    case "lastMarketTime":
                        await oracle.lastMarketTime();
                        break;
                    case "activeMarketIds":
                        await oracle.activeMarketIds();
                        break;
                    case "pythOracle":
                        await oracle.pythOracle();
                        break;
                    case "getUserOpenPositions":
                        await oracle.getUserOpenPositions(deployer.address);
                        break;
                    case "userSpendings":
                        await oracle.userSpendings(deployer.address);
                        break;
                    case "userRedeemed":
                        await oracle.userRedeemed(deployer.address);
                        break;
                }
                workingCount++;
            } catch (e) {
                // Function failed
            }
        }
        
        console.log(`✅ ${workingCount}/${tests.length} core functions working`);
        
        if (workingCount === tests.length) {
            console.log("🎉 Contract is fully functional!");
        } else if (workingCount >= tests.length * 0.8) {
            console.log("⚠️  Contract is mostly functional with some issues");
        } else {
            console.log("❌ Contract has significant issues");
        }
        
        console.log("\n🔗 Useful Links");
        console.log("===============");
        console.log(`Oracle contract: https://sepolia.etherscan.io/address/${oracleAddress}`);
        if (process.env.SEPOLIA_TOKEN) {
            console.log(`Token contract: https://sepolia.etherscan.io/address/${process.env.SEPOLIA_TOKEN}`);
        }
        console.log("PYTH Network: https://pyth.network/price-feeds");
        
        console.log("\n💡 Next Steps");
        console.log("=============");
        console.log("1. Create a market: npx hardhat run scripts/create-market-sepolia.js --network sepolia");
        console.log("2. Check markets: npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia");
        console.log("3. Test PYTH feeds: npx hardhat run scripts/test-pyth-sepolia.js --network sepolia");
        
    } catch (error) {
        console.error("❌ Failed to test contract:", error.message);
        
        if (error.message.includes("call exception")) {
            console.log("💡 This might be a network issue or invalid contract address");
        } else if (error.message.includes("execution reverted")) {
            console.log("💡 Contract call reverted - check contract state");
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
