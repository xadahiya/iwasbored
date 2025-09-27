const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing PYTH Oracle on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // PYTH Oracle address for Sepolia
    const PYTH_ORACLE_ADDRESS = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";
    
    console.log("🏭 PYTH Oracle address:", PYTH_ORACLE_ADDRESS);
    
    try {
        // Connect to PYTH oracle with minimal interface
        const pythOracle = await ethers.getContractAt([
            "function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
            "function getPriceUnsafe(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
            "function getPriceNoOlderThan(bytes32 id, uint age) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)"
        ], PYTH_ORACLE_ADDRESS);
        
        console.log("✅ Connected to PYTH Oracle contract");
        
        // Test price feeds
        const priceFeeds = {
            "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
            "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
            "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
            "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
        };
        
        console.log("\n📊 Testing Price Feeds");
        console.log("======================");
        
        for (const [feedName, priceId] of Object.entries(priceFeeds)) {
            console.log(`\n🔍 Testing ${feedName}:`);
            console.log(`   Price ID: ${priceId}`);
            
            try {
                // Try getPriceUnsafe first (doesn't check staleness)
                console.log("   Trying getPriceUnsafe...");
                const priceUnsafe = await pythOracle.getPriceUnsafe(priceId);
                
                console.log("   ✅ getPriceUnsafe successful!");
                const price = Number(priceUnsafe.price) * Math.pow(10, Number(priceUnsafe.expo));
                console.log(`   Price: $${price.toFixed(2)}`);
                console.log(`   Confidence: ${priceUnsafe.conf.toString()}`);
                console.log(`   Expo: ${priceUnsafe.expo.toString()}`);
                console.log(`   Publish Time: ${new Date(Number(priceUnsafe.publishTime) * 1000).toLocaleString()}`);
                
                const ageSeconds = Math.floor(Date.now() / 1000) - Number(priceUnsafe.publishTime);
                console.log(`   Age: ${ageSeconds} seconds`);
                
                // Try getPrice (checks staleness)
                try {
                    console.log("   Trying getPrice...");
                    const priceWithStaleness = await pythOracle.getPrice(priceId);
                    console.log("   ✅ getPrice also successful!");
                } catch (staleError) {
                    console.log("   ⚠️ getPrice failed (possibly stale):", staleError.message);
                    if (staleError.message.includes("stale")) {
                        console.log("   💡 This means the price is too old. You may need to update it first.");
                    }
                }
                
            } catch (error) {
                console.log("   ❌ Failed:", error.message);
                
                if (error.message.includes("execution reverted")) {
                    console.log("   💡 This price feed might not be available on Sepolia PYTH oracle");
                } else if (error.message.includes("call exception")) {
                    console.log("   💡 Contract call failed - check network connectivity");
                } else {
                    console.log(`   💡 Raw error: ${error}`);
                }
            }
        }
        
        console.log("\n🔍 PYTH Oracle Contract Analysis");
        console.log("================================");
        
        try {
            // Try to get some basic info about the contract
            const code = await ethers.provider.getCode(PYTH_ORACLE_ADDRESS);
            if (code === "0x") {
                console.log("❌ No contract code found at this address!");
            } else {
                console.log("✅ Contract code exists");
                console.log(`   Code size: ${(code.length - 2) / 2} bytes`);
            }
        } catch (error) {
            console.log("❌ Could not analyze contract:", error.message);
        }
        
        console.log("\n💡 Recommendations");
        console.log("==================");
        
        if (Date.now() / 1000 > 1640000000) { // After 2021
            console.log("1. 🔄 Try updating price feeds before fetching prices");
            console.log("2. 📡 Check PYTH network status: https://pyth.network/");
            console.log("3. 🔗 Verify Sepolia PYTH oracle address is correct");
            console.log("4. 💰 Ensure sufficient ETH for price update fees");
            console.log("5. ⏰ Some price feeds might be stale and need updates");
        }
        
        console.log("\n🧪 Test Commands:");
        console.log("# Test with price updates:");
        console.log("npx hardhat run scripts/create-market-sepolia.js --network sepolia");
        console.log("# Check oracle configuration:");
        console.log("npx hardhat run scripts/check-markets-sepolia-enhanced.js --network sepolia");
        
    } catch (error) {
        console.error("❌ Failed to test PYTH oracle:", error.message);
        
        if (error.message.includes("network")) {
            console.log("💡 Check your Sepolia RPC connection");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 Get more Sepolia ETH from https://sepoliafaucet.com/");
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
