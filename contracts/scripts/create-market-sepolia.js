const { ethers } = require("hardhat");
const https = require('https');

// Simple market creation without gas configuration

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
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}


async function main() {
    console.log("🎲 Creating a random market on Ethereum Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get oracle address from environment or use default
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
        
        // Small fee for PYTH price update
        const updateFee = ethers.parseEther("0.001");
        console.log("PYTH Update Fee:", ethers.formatEther(updateFee), "ETH");
        
        console.log("\n🚀 Creating market...");
        
        // Generate a unique question ID
        const questionId = ethers.keccak256(ethers.toUtf8Bytes(`market-${Date.now()}`));
        const endTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        const priceFeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"; // ETH/USD
        console.log("📞 Fetching Pyth update data for ETH/USD...");
        const priceUpdateData = await getPythUpdateData(priceFeedId);
        console.log("✅ Pyth update data received.");

        const tx = await oracle.createMarket(questionId, 0, endTimestamp, priceUpdateData, {
            value: updateFee
        });
        
        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
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
            
            console.log("\n🎉 Market created successfully!");
            console.log("Question ID:", questionId.toString());
            console.log("Price Feed ID:", priceId);
            console.log("Initial Price:", ethers.formatUnits(initialPrice, 8)); // PYTH uses 8 decimals
            console.log("End Time:", new Date(Number(endTimestamp) * 1000).toLocaleString());
            console.log("FPMM Address:", fpmmAddress);
            console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        } else {
            console.log("⚠️  Market creation event not found in transaction logs");
        }
        
    } catch (error) {
        console.error("❌ Failed to create market:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Solution: Get more Sepolia ETH from https://sepoliafaucet.com/");
        } else if (error.message.includes("update fee")) {
            console.log("💡 Solution: Increase the PYTH update fee");
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
