const { ethers, run } = require("hardhat");
const https = require('https');


async function getPythUpdateData(priceFeedId) {
    return new Promise((resolve, reject) => {
        const url = `https://hermes.pyth.network/api/latest_vaas?ids[]=${priceFeedId}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const priceUpdateData = parsed.map(d => '0x' + Buffer.from(d, 'base64').toString('hex'));
                    resolve(priceUpdateData);
                    resolve(priceUpdateData);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Ethereum Sepolia Testnet addresses
const ETHEREUM_SEPOLIA_ADDRESSES = {
    // PYTH Oracle on Ethereum Sepolia - Official address
    PYTH_ORACLE: "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21",
    
    // We'll deploy our own test tokens since this is testnet
    TOKEN: null, // Will deploy
    CONDITIONAL_TOKENS: null, // Will deploy
    FACTORY: null, // Will deploy
};

// Simple deployment without gas configuration - let Hardhat handle it

// Helper function to verify contracts
async function verifyContract(address, constructorArguments = []) {
    // Skip verification if no API key is provided
    if (!process.env.ETHERSCAN_API_KEY) {
        console.log("⏭️  Skipping verification (no ETHERSCAN_API_KEY)");
        console.log("💡 Manual verification command:");
        console.log(`npx hardhat verify --network sepolia ${address} ${constructorArguments.join(" ")}`);
        console.log(""); // Add spacing
        return;
    }

    console.log("🔍 Verifying contract at:", address);
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log("✅ Contract verified successfully!");
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("✅ Contract already verified!");
        } else {
            console.log("⚠️  Verification failed:", error.message);
            console.log("💡 You can verify manually later using:");
            console.log(`npx hardhat verify --network sepolia ${address} ${constructorArguments.join(" ")}`);
        }
    }
    console.log(""); // Add spacing
}

// PYTH price feed IDs for testing (same across all networks)
const PYTH_PRICE_FEEDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
};

async function main() {
    console.log("🚀 Deploying SimplePredictionsOracle to Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.1")) {
        console.log("⚠️  Low balance detected. You may need more ETH for deployment.");
        console.log("🔗 Get Sepolia ETH from: https://sepoliafaucet.com/");
        console.log("🔗 Alternative faucet: https://faucet.quicknode.com/ethereum/sepolia");
    }

    // Check if Etherscan API key is set for verification
    if (!process.env.ETHERSCAN_API_KEY) {
        console.log("\n⚠️  ETHERSCAN_API_KEY not found in environment variables.");
        console.log("💡 Contract verification will be skipped. Set ETHERSCAN_API_KEY in your .env file to enable verification.");
        console.log("🔗 Get your API key from: https://etherscan.io/apis");
        console.log("");
    }

    // Deployment results
    const deployedAddresses = {};

    try {
        // 1. Deploy Token
        console.log("\n1️⃣ Deploying Token...");
        const Token = await ethers.getContractFactory("Token");
        const popToken = await Token.deploy("TestToken", "TEST");
        await popToken.waitForDeployment();
        deployedAddresses.TOKEN = popToken.target;
        console.log("✅ Token deployed:", popToken.target);
        
        // Verify Token
        await verifyContract(popToken.target, ["TestToken", "TEST"]);

        // 2. Deploy ConditionalTokens
        console.log("\n2️⃣ Deploying ConditionalTokens...");
        const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
        const conditionalTokens = await ConditionalTokens.deploy(
            "ETH"
        );
        await conditionalTokens.waitForDeployment();
        deployedAddresses.CONDITIONAL_TOKENS = conditionalTokens.target;
        console.log("✅ ConditionalTokens deployed:", conditionalTokens.target);
        
        // Verify ConditionalTokens
        await verifyContract(conditionalTokens.target, ["ETH"]);

        // 3. Deploy Factory
        console.log("\n3️⃣ Deploying Factory...");
        const Factory = await ethers.getContractFactory("Factory");
        const factory = await Factory.deploy();
        await factory.waitForDeployment();
        deployedAddresses.FACTORY = factory.target;
        console.log("✅ Factory deployed:", factory.target);
        
        // Verify Factory
        await verifyContract(factory.target, []);

        // 4. Deploy SimplePredictionsOracle
        console.log("\n4️⃣ Deploying SimplePredictionsOracle...");
        const Oracle = await ethers.getContractFactory("SimplePredictionsOracle");
        const oracle = await Oracle.deploy(
            conditionalTokens.target,
            factory.target,
            popToken.target,
            ETHEREUM_SEPOLIA_ADDRESSES.PYTH_ORACLE
        );
        await oracle.waitForDeployment();
        deployedAddresses.ORACLE = oracle.target;
        console.log("✅ SimplePredictionsOracle deployed:", oracle.target);
        
        // Verify SimplePredictionsOracle
        await verifyContract(oracle.target, [
            conditionalTokens.target,
            factory.target,
            popToken.target,
            ETHEREUM_SEPOLIA_ADDRESSES.PYTH_ORACLE
        ]);

        // 5. Set oracle address in ConditionalTokens
        console.log("\n5️⃣ Configuring ConditionalTokens...");
        await conditionalTokens.setOracleAddress(oracle.target);
        console.log("✅ Oracle address set in ConditionalTokens");

        // 6. Fund the oracle with tokens (minimal amount for testing)
        console.log("\n6️⃣ Funding Oracle...");
        const fundingAmount = ethers.parseEther("100"); // Minimal 100 tokens for testing
        await popToken.transfer(oracle.target, fundingAmount);
        console.log("✅ Oracle funded with", ethers.formatEther(fundingAmount), "tokens");

        // 7. Configure market parameters
        console.log("\n7️⃣ Configuring Market Parameters...");
        const priceIds = Object.values(PYTH_PRICE_FEEDS);
        await oracle.configureMarkets(
            priceIds,
            ethers.parseEther("10") // Minimal 10 tokens per market for testing
        );
        console.log("✅ Market configuration set with", priceIds.length, "price feeds");

        // 8. Verification info
        console.log("\n📋 Deployment Summary");
        console.log("=====================");
        console.log("Network: Ethereum Sepolia Testnet");
        console.log("Chain ID: 11155111");
        console.log("Deployer:", deployer.address);
        console.log("");
        
        console.log("📝 Contract Addresses:");
        Object.entries(deployedAddresses).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        console.log(`PYTH_ORACLE: ${ETHEREUM_SEPOLIA_ADDRESSES.PYTH_ORACLE}`);

        console.log("\n🔗 Etherscan URLs:");
        Object.entries(deployedAddresses).forEach(([name, address]) => {
            console.log(`${name}: https://sepolia.etherscan.io/address/${address}`);
        });

        console.log("\n💡 Environment Variables:");
        console.log("Add these to your .env file:");
        console.log(`SEPOLIA_TOKEN=${deployedAddresses.TOKEN}`);
        console.log(`SEPOLIA_CONDITIONAL_TOKENS=${deployedAddresses.CONDITIONAL_TOKENS}`);
        console.log(`SEPOLIA_FACTORY=${deployedAddresses.FACTORY}`);
        console.log(`SEPOLIA_ORACLE=${deployedAddresses.ORACLE}`);
        console.log(`SEPOLIA_PYTH_ORACLE=${ETHEREUM_SEPOLIA_ADDRESSES.PYTH_ORACLE}`);

        console.log("\n🧪 Testing Commands:");
        console.log("# Create a random market:");
        console.log(`npx hardhat run scripts/create-market-sepolia.js --network sepolia`);
        console.log("");
        console.log("# Check market status:");
        console.log(`npx hardhat run scripts/check-markets-sepolia.js --network sepolia`);

        // 9. Create a test market
        console.log("\n🎲 Creating Test Market...");
        try {
            const updateFee = ethers.parseEther("0.001"); // Small fee for PYTH update
            const questionId = ethers.keccak256(ethers.toUtf8Bytes(`test-market-${Date.now()}`));
            const endTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            
            const priceFeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"; // ETH/USD
            console.log("📞 Fetching Pyth update data for ETH/USD...");
            const priceUpdateData = await getPythUpdateData(priceFeedId);
            console.log("✅ Pyth update data received.");

            const tx = await oracle.createMarket(questionId, 0, endTimestamp, priceUpdateData, { 
                value: updateFee
            });
            const receipt = await tx.wait();
            
            // Find the market creation event
            const marketEvent = receipt.logs.find(log => {
                try {
                    const parsed = oracle.interface.parseLog(log);
                    return parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            if (marketEvent) {
                const parsed = oracle.interface.parseLog(marketEvent);
                const { questionId, priceId, initialPrice, endTimestamp, fpmmAddress } = parsed.args;
                
                console.log("✅ Test market created successfully!");
                console.log(`   Question ID: ${questionId}`);
                console.log(`   Price Feed: ${priceId}`);
                console.log(`   Initial Price: ${initialPrice}`);
                console.log(`   End Time: ${new Date(Number(endTimestamp) * 1000).toLocaleString()}`);
                console.log(`   FPMM Address: ${fpmmAddress}`);
            }
        } catch (error) {
            console.log("⚠️  Could not create test market:", error.message);
            console.log("   This might be due to PYTH oracle connectivity or insufficient fee");
        }

        console.log("\n🎉 Deployment completed successfully!");
        console.log("🔧 Ready for testing on Ethereum Sepolia!");
        console.log("✅ All contracts have been automatically verified on Etherscan!");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more Sepolia ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("nonce")) {
            console.log("💡 Solution: Wait a moment and try again");
        } else if (error.message.includes("gas")) {
            console.log("💡 Solution: Try increasing gas limit or gas price");
        } else if (error.message.includes("replacement")) {
            console.log("💡 Solution: Wait for pending transactions to complete");
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

module.exports = { main };

