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
            const initialFunding = ethers.parseEther("100"); // 100 tokens

            const tx = await this.oracle.configureMarkets(
                priceIds,
                initialFunding
            );

            await tx.wait();
            console.log("✅ PYTH price feeds configured successfully");
            console.log("Price feeds:", Object.keys(PYTH_PRICE_IDS));
            console.log("Initial funding:", ethers.formatEther(initialFunding), "tokens");
            
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

    async createMarket() {
        try {
            console.log("\n=== Creating Market ===");

            // Get price update data
            const priceUpdateData = await this.getPriceUpdateData();
            
            // Estimate update fee (usually very small, like 0.001 ETH)
            const updateFee = ethers.parseEther("0.001");

            console.log("🎲 Creating market...");
            
            // Generate unique question ID
            const questionId = ethers.keccak256(ethers.toUtf8Bytes(`auto-market-${Date.now()}`));
            const endTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            
            const tx = await this.oracle.createMarket(questionId, endTimestamp, priceUpdateData, {
                value: updateFee
            });

            const receipt = await tx.wait();
            
            // Parse the MarketCreated event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.oracle.interface.parseLog(log);
                    return parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = this.oracle.interface.parseLog(event);
                const { questionId, priceId, initialPrice, endTimestamp, fpmmAddress } = parsed.args;
                
                console.log("✅ Market created successfully!");
                console.log("Question ID:", questionId);
                console.log("Price Feed:", this.getPriceFeedName(priceId));
                console.log("Initial Price:", initialPrice.toString());
                console.log("End Time:", new Date(Number(endTimestamp) * 1000).toLocaleString());
                console.log("FPMM Address:", fpmmAddress);
                
                return {
                    questionId,
                    priceId,
                    initialPrice,
                    endTimestamp,
                    fpmmAddress
                };
            }
            
        } catch (error) {
            console.error("❌ Error creating market:", error);
            return null;
        }
    }

    async resolveExpiredMarkets() {
        try {
            console.log("\n=== Resolving Expired Markets ===");
            
            // Get active markets and check which ones are expired
            const activeMarkets = await this.oracle.activeMarketIds();
            const expiredQuestionIds = [];
            
            for (const questionId of activeMarkets) {
                try {
                    const marketData = await this.oracle.getMarketData(questionId);
                    const now = Math.floor(Date.now() / 1000);
                    const isExpired = now >= Number(marketData.questionData.endTimestamp);
                    const isResolved = marketData.answerData.answerTimestamp > 0;
                    
                    if (isExpired && !isResolved) {
                        expiredQuestionIds.push(questionId);
                    }
                } catch (error) {
                    console.log(`Error checking market ${questionId}:`, error.message);
                }
            }
            
            if (expiredQuestionIds.length === 0) {
                console.log("ℹ️ No expired markets to resolve");
                return;
            }

            console.log(`🔄 Found ${expiredQuestionIds.length} expired markets to resolve`);
            
            const priceUpdateData = await this.getPriceUpdateData();
            const updateFee = ethers.parseEther("0.001");

            // Resolve each market individually
            for (const questionId of expiredQuestionIds) {
                try {
                    console.log(`Resolving market ${questionId}...`);
                    const tx = await this.oracle.resolveMarket(questionId, priceUpdateData, "auto-resolved", {
                        value: updateFee
                    });
                    await tx.wait();
                    console.log(`✅ Market ${questionId} resolved successfully!`);
                } catch (error) {
                    console.log(`❌ Error resolving market ${questionId}:`, error.message);
                }
            }
            
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
            
            const config = await this.oracle.getMarketConfig();
            const activeMarkets = await this.oracle.activeMarketIds();
            const lastMarketTime = await this.oracle.lastMarketTime();
            
            console.log("Available price feeds:", config.priceIds.length);
            console.log("Initial funding per market:", ethers.formatEther(config.initialFunding), "tokens");
            console.log("Active markets:", activeMarkets.length);
            console.log("Last market created:", new Date(Number(lastMarketTime) * 1000).toLocaleString());
            
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
            await this.createMarket();
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
        await automator.createMarket();
        
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
