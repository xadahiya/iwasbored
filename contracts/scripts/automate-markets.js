const { ethers } = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

// PYTH price feed IDs for popular assets
const PYTH_PRICE_IDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "AVAX/USD": "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7",
    "MATIC/USD": "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52"
};

class PredictionMarketAutomator {
    constructor(oracleAddress, pythOracleAddress) {
        this.oracleAddress = oracleAddress;
        this.pythOracleAddress = pythOracleAddress;
        this.oracle = null;
        this.signer = null;
    }

    async initialize() {
        // Get the signer (deployer)
        const [deployer] = await ethers.getSigners();
        this.signer = deployer;

        // Get the oracle contract
        const OracleFactory = await ethers.getContractFactory("SimplePredictionsOracle");
        this.oracle = OracleFactory.attach(this.oracleAddress);

        console.log("Automator initialized");
        console.log("Oracle address:", this.oracleAddress);
        console.log("Deployer address:", deployer.address);
    }

    async configurePythFeeds() {
        try {
            console.log("\n=== Configuring PYTH Price Feeds ===");
            
            const priceIds = Object.values(PYTH_PRICE_IDS);
            const minDuration = 300; // 5 minutes
            const maxDuration = 3600; // 1 hour
            const marketInterval = 180; // 3 minutes between markets
            const initialFunding = ethers.parseEther("100"); // 100 tokens
            const autoCreateEnabled = true;

            const tx = await this.oracle.configureRandomMarkets(
                priceIds,
                minDuration,
                maxDuration,
                marketInterval,
                initialFunding,
                autoCreateEnabled
            );

            await tx.wait();
            console.log("✅ PYTH price feeds configured successfully");
            console.log("Price feeds:", Object.keys(PYTH_PRICE_IDS));
            console.log("Market interval:", marketInterval, "seconds");
            
        } catch (error) {
            console.error("❌ Error configuring PYTH feeds:", error);
        }
    }

    async getPriceUpdateData() {
        try {
            // In a real implementation, you would fetch this from PYTH's Hermes API
            // For testing purposes, we'll return empty array
            // You can use: https://hermes.pyth.network/api/latest_price_feeds?ids[]=<price_id>
            
            console.log("📊 Fetching PYTH price update data...");
            
            // This is a placeholder - in production you would call:
            // const response = await fetch(`https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceId}`);
            // const data = await response.json();
            // return data.binary.data;
            
            return []; // Empty for now - you'll need to implement actual PYTH data fetching
        } catch (error) {
            console.error("❌ Error fetching price data:", error);
            return [];
        }
    }

    async createRandomMarket() {
        try {
            console.log("\n=== Creating Random Market ===");
            
            // Check if we can create a random market
            const canCreate = await this.oracle.canCreateRandomMarket();
            if (!canCreate) {
                console.log("⏳ Cannot create random market yet (interval not elapsed or insufficient funds)");
                return null;
            }

            // Get price update data
            const priceUpdateData = await this.getPriceUpdateData();
            
            // Estimate update fee (usually very small, like 0.001 ETH)
            const updateFee = ethers.parseEther("0.001");

            console.log("🎲 Creating random market...");
            const tx = await this.oracle.createRandomMarket(priceUpdateData, {
                value: updateFee
            });

            const receipt = await tx.wait();
            
            // Parse the RandomMarketCreated event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.oracle.interface.parseLog(log);
                    return parsed.name === "RandomMarketCreated";
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = this.oracle.interface.parseLog(event);
                const { questionId, priceId, targetPrice, endTimestamp, fpmmAddress } = parsed.args;
                
                console.log("✅ Random market created successfully!");
                console.log("Question ID:", questionId);
                console.log("Price Feed:", this.getPriceFeedName(priceId));
                console.log("Target Price:", targetPrice.toString());
                console.log("End Time:", new Date(Number(endTimestamp) * 1000).toLocaleString());
                console.log("FPMM Address:", fpmmAddress);
                
                return {
                    questionId,
                    priceId,
                    targetPrice,
                    endTimestamp,
                    fpmmAddress
                };
            }
            
        } catch (error) {
            console.error("❌ Error creating random market:", error);
            return null;
        }
    }

    async resolveExpiredMarkets() {
        try {
            console.log("\n=== Resolving Expired Markets ===");
            
            // In a real implementation, you would track active markets
            // For this example, we'll just demonstrate the resolution function
            
            const expiredQuestionIds = []; // You would populate this with actual expired market IDs
            
            if (expiredQuestionIds.length === 0) {
                console.log("ℹ️ No expired markets to resolve");
                return;
            }

            const priceUpdateData = await this.getPriceUpdateData();
            const updateFee = ethers.parseEther("0.001");

            console.log(`🔄 Resolving ${expiredQuestionIds.length} expired markets...`);
            const tx = await this.oracle.autoResolveMarkets(expiredQuestionIds, priceUpdateData, {
                value: updateFee
            });

            const receipt = await tx.wait();
            console.log("✅ Markets resolved successfully!");
            
        } catch (error) {
            console.error("❌ Error resolving markets:", error);
        }
    }

    getPriceFeedName(priceId) {
        for (const [name, id] of Object.entries(PYTH_PRICE_IDS)) {
            if (id === priceId) {
                return name;
            }
        }
        return "Unknown";
    }

    async getMarketStatus() {
        try {
            console.log("\n=== Market Status ===");
            
            const config = await this.oracle.getRandomMarketConfig();
            const canCreate = await this.oracle.canCreateRandomMarket();
            
            console.log("Auto-creation enabled:", config.autoCreateEnabled);
            console.log("Market interval:", config.marketInterval.toString(), "seconds");
            console.log("Can create new market:", canCreate);
            console.log("Available price feeds:", config.priceIds.length);
            
        } catch (error) {
            console.error("❌ Error getting market status:", error);
        }
    }

    async startAutomation() {
        console.log("\n🤖 Starting Prediction Market Automation...");
        
        // Configure PYTH feeds (run once)
        await this.configurePythFeeds();
        
        // Start automation loop
        setInterval(async () => {
            await this.getMarketStatus();
            await this.createRandomMarket();
            await this.resolveExpiredMarkets();
        }, 60000); // Check every minute
        
        console.log("✅ Automation started! Markets will be created and resolved automatically.");
    }
}

async function main() {
    try {
        // You'll need to update these addresses after deployment
        const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || "0x..."; // Your deployed oracle address
        const PYTH_ORACLE_ADDRESS = process.env.PYTH_ORACLE_ADDRESS || "0x..."; // PYTH oracle address for your network
        
        if (ORACLE_ADDRESS === "0x..." || PYTH_ORACLE_ADDRESS === "0x...") {
            console.error("❌ Please set ORACLE_ADDRESS and PYTH_ORACLE_ADDRESS in your .env file");
            process.exit(1);
        }

        const automator = new PredictionMarketAutomator(ORACLE_ADDRESS, PYTH_ORACLE_ADDRESS);
        await automator.initialize();
        
        // For testing, you can run individual functions:
        await automator.getMarketStatus();
        await automator.createRandomMarket();
        
        // Or start full automation:
        // await automator.startAutomation();
        
    } catch (error) {
        console.error("❌ Error in main:", error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { PredictionMarketAutomator, PYTH_PRICE_IDS };
