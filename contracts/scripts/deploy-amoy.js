const { ethers } = require("hardhat");

// Polygon Amoy Testnet addresses
const POLYGON_AMOY_ADDRESSES = {
    // PYTH Oracle on Polygon Amoy
    PYTH_ORACLE: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
    
    // We'll deploy our own test tokens since this is testnet
    TOKEN: null, // Will deploy
    CONDITIONAL_TOKENS: null, // Will deploy
    FACTORY: null, // Will deploy
};

// PYTH price feed IDs for testing
const PYTH_PRICE_FEEDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "MATIC/USD": "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52",
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
};

async function main() {
    console.log("🚀 Deploying SimplePredictionsOracle to Polygon Amoy...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");
    
    if (balance < ethers.parseEther("0.1")) {
        console.log("⚠️  Low balance detected. You may need more MATIC for deployment.");
        console.log("🔗 Get MATIC from: https://faucet.polygon.technology/");
    }

    // Deployment results
    const deployedAddresses = {};

    try {
        // 1. Deploy Token
        console.log("\n1️⃣ Deploying Token...");
        const Token = await ethers.getContractFactory("Token");
        const popToken = await Token.deploy("Token", "TOKEN");
        await popToken.waitForDeployment();
        deployedAddresses.TOKEN = popToken.target;
        console.log("✅ Token deployed:", popToken.target);

        // 2. Deploy ConditionalTokens
        console.log("\n2️⃣ Deploying ConditionalTokens...");
        const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
        const conditionalTokens = await ConditionalTokens.deploy("https://api.onchainpoints.xyz/metadata/".substring(0, 32));
        await conditionalTokens.waitForDeployment();
        deployedAddresses.CONDITIONAL_TOKENS = conditionalTokens.target;
        console.log("✅ ConditionalTokens deployed:", conditionalTokens.target);

        // 3. Deploy Factory
        console.log("\n3️⃣ Deploying Factory...");
        const Factory = await ethers.getContractFactory("Factory");
        const factory = await Factory.deploy();
        await factory.waitForDeployment();
        deployedAddresses.FACTORY = factory.target;
        console.log("✅ Factory deployed:", factory.target);

        // 4. Deploy SimplePredictionsOracle
        console.log("\n4️⃣ Deploying SimplePredictionsOracle...");
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = await Oracle.deploy(
            conditionalTokens.target,
            factory.target,
            popToken.target,
            POLYGON_AMOY_ADDRESSES.PYTH_ORACLE
        );
        await oracle.waitForDeployment();
        deployedAddresses.ORACLE = oracle.target;
        console.log("✅ SimplePredictionsOracle deployed:", oracle.target);

        // 5. Set oracle address in ConditionalTokens
        console.log("\n5️⃣ Configuring ConditionalTokens...");
        await conditionalTokens.setOracleAddress(oracle.target);
        console.log("✅ Oracle address set in ConditionalTokens");

        // 6. Fund the oracle with tokens (reduced amount)
        console.log("\n6️⃣ Funding Oracle...");
        const fundingAmount = ethers.parseEther("1000"); // 1K tokens instead of 50K
        await popToken.transfer(oracle.target, fundingAmount);
        console.log("✅ Oracle funded with", ethers.formatEther(fundingAmount), "tokens");

        // 7. Configure random markets
        console.log("\n7️⃣ Configuring Random Markets...");
        const priceIds = Object.values(PYTH_PRICE_FEEDS);
        await oracle.configureRandomMarkets(
            priceIds,
            300,  // 5 minutes min duration
            3600, // 1 hour max duration
            180,  // 3 minutes between markets
            ethers.parseEther("1000"), // 1000 tokens initial funding per market
            true  // auto-create enabled
        );
        console.log("✅ Random markets configured with", priceIds.length, "price feeds");

        // 8. Verification info
        console.log("\n📋 Deployment Summary");
        console.log("=====================");
        console.log("Network: Polygon Amoy Testnet");
        console.log("Chain ID: 80002");
        console.log("Deployer:", deployer.address);
        console.log("");
        
        console.log("📝 Contract Addresses:");
        Object.entries(deployedAddresses).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        console.log(`PYTH_ORACLE: ${POLYGON_AMOY_ADDRESSES.PYTH_ORACLE}`);

        console.log("\n🔗 Block Explorer URLs:");
        Object.entries(deployedAddresses).forEach(([name, address]) => {
            console.log(`${name}: https://amoy.polygonscan.com/address/${address}`);
        });

        console.log("\n💡 Environment Variables:");
        console.log("Add these to your .env file:");
        console.log(`AMOY_TOKEN=${deployedAddresses.TOKEN}`);
        console.log(`AMOY_CONDITIONAL_TOKENS=${deployedAddresses.CONDITIONAL_TOKENS}`);
        console.log(`AMOY_FACTORY=${deployedAddresses.FACTORY}`);
        console.log(`AMOY_ORACLE=${deployedAddresses.ORACLE}`);
        console.log(`AMOY_PYTH_ORACLE=${POLYGON_AMOY_ADDRESSES.PYTH_ORACLE}`);

        console.log("\n🧪 Testing Commands:");
        console.log("# Create a random market:");
        console.log(`npx hardhat run scripts/create-market-amoy.js --network amoy`);
        console.log("");
        console.log("# Check market status:");
        console.log(`npx hardhat run scripts/check-markets-amoy.js --network amoy`);

        // 9. Create a test market
        console.log("\n🎲 Creating Test Market...");
        try {
            const updateFee = ethers.parseEther("0.001"); // Small fee for PYTH update
            const tx = await oracle.createRandomMarket([], { value: updateFee });
            const receipt = await tx.wait();
            
            // Find the market creation event
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
                const { questionId, priceId, targetPrice, endTimestamp } = parsed.args;
                
                console.log("✅ Test market created successfully!");
                console.log(`   Question ID: ${questionId}`);
                console.log(`   Price Feed: ${priceId}`);
                console.log(`   Target Price: ${targetPrice}`);
                console.log(`   End Time: ${new Date(Number(endTimestamp) * 1000).toLocaleString()}`);
            }
        } catch (error) {
            console.log("⚠️  Could not create test market:", error.message);
            console.log("   This might be due to PYTH oracle connectivity");
        }

        console.log("\n🎉 Deployment completed successfully!");
        console.log("🔧 Ready for testing on Polygon Amoy!");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more MATIC from https://faucet.polygon.technology/");
        } else if (error.message.includes("nonce")) {
            console.log("💡 Solution: Wait a moment and try again");
        } else if (error.message.includes("gas")) {
            console.log("💡 Solution: Try increasing gas limit or gas price");
        }
        
        process.exit(1);
    }
}

// Helper function to wait for user confirmation
async function confirmDeployment() {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('Continue with deployment? (y/N): ', (answer) => {
            readline.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main, POLYGON_AMOY_ADDRESSES, PYTH_PRICE_FEEDS };
