#!/usr/bin/env python3
"""
Script to fetch active market IDs, monitor end timestamps, and resolve expired markets
"""
import asyncio
import logging
import json
import base64
import os
import time
from datetime import datetime, timedelta
from typing import List, Dict

import aiohttp
from dotenv import load_dotenv

from app_state import AppState

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
CHECK_INTERVAL = 60  # Check every minute
RESOLVE_DELAY = 0 
AUTH_TOKEN = "iwasbored"


class MarketMonitor:
    def __init__(self):
        self.app_state = AppState()
        self.active_markets = {}  # question_id -> {'end_timestamp': int, 'fpmm_address': str}
        self.resolved_markets = set()
        self.last_check_time = 0

    async def initialize(self):
        """Initialize the market monitor"""
        logger.info("🚀 Initializing market monitor...")
        await self.app_state.initialize()
        logger.info("✅ Market monitor initialized successfully")

    async def fetch_active_market_ids(self) -> List[str]:
        """Fetch all active market IDs from the contract"""
        logger.info("📊 Fetching active market IDs...")
        
        try:
            # Get the number of active markets
            market_count = await self.app_state.oracle_contract.functions.getActiveMarketIds().call()
            logger.info(f"Found {len(market_count)} active market IDs")
            
            # Filter out None/empty values
            valid_markets = ['0x'+market.hex() for market in market_count if market]
            logger.info(f"Valid active markets: {len(valid_markets)}")
            
            return valid_markets
        except Exception as e:
            logger.error(f"❌ Failed to fetch active market IDs: {e}")
            return []

    async def get_market_data(self, market_id: str) -> Dict:
        """Get detailed market data for a specific market"""
        try:
            market_data = await self.app_state.oracle_contract.functions.getMarketData(market_id).call()
            return market_data
        except Exception as e:
            logger.error(f"❌ Failed to get market data for {market_id}: {e}")
            return None

    async def resolve_expired_market(self, market_id: str, market_data: Dict):
        """Resolve an expired market using the /resolveMarket backend endpoint"""
        logger.info(f"🔍 Attempting to resolve expired market: {market_id}")
        
        try:
            # Get Pyth price feed data
            price_feed_id = '0x' + market_data[0][3].hex()  # priceFeedId from questionData
            price_update_data = await self._get_pyth_update_data(price_feed_id)
            
            if not price_update_data:
                logger.error(f"❌ Failed to get Pyth data for market {market_id}")
                return False
            
            # Get current time for answer CID
            answer_cid = f"resolved-{int(time.time())}"
            
            # Use backend /resolveMarket endpoint
            backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000/resolveMarket')
            
            payload = {
                "question_id": market_id,
                "price_update_data": price_update_data,
                "answer_cid": answer_cid,
                "value": 10000000000,
                "auth_token": AUTH_TOKEN
            }
            
            logger.info(f"📡 Calling backend /resolveMarket endpoint for market {market_id}")
            
            async with aiohttp.ClientSession() as session:
                headers = {'Content-Type': 'application/json'}
                
                async with session.post(backend_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get('info', {}).get('success', False):
                            logger.info(f"✅ Successfully resolved market {market_id} via backend")
                            logger.info(f"Response: {result}")
                            return True
                        else:
                            logger.error(f"❌ Backend resolution failed for market {market_id}: {result}")
                            return False
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Backend call failed: {response.status} - {error_text}")
                        return False
            
        except Exception as e:
            logger.error(f"❌ Failed to resolve market {market_id}: {e}")
            return False

    async def _get_pyth_update_data(self, price_feed_id: str) -> List[str]:
        """Get Pyth update data from the Hermes API"""
        url = f"https://hermes.pyth.network/api/latest_vaas?ids[]={price_feed_id}"
        
        logger.info(f"Fetching Pyth data from: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.text()
                        parsed = json.loads(data)
                        price_update_data = ['0x' + base64.b64decode(d).hex() for d in parsed]
                        logger.info(f"✅ Pyth data retrieved for {price_feed_id}")
                        return price_update_data
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Failed to fetch Pyth data: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"❌ Error fetching Pyth update data: {e}")
            return None

    async def update_active_markets(self):
        """Update the list of active markets and their end timestamps"""
        current_time = int(time.time())
        logger.info(f"⏰ Updating active markets at {datetime.fromtimestamp(current_time)}")
        
        # Fetch current active market IDs
        active_market_ids = await self.fetch_active_market_ids()
        
        # Update our local tracking
        new_markets = {}
        
        for market_id in active_market_ids:
            try:
                market_data = await self.get_market_data(market_id)
                
                if market_data:
                    end_timestamp = market_data[0][1]  # endTimestamp from questionData
                    fpmm_address = market_data[0][2]   # fpmm address from questionData
                    
                    new_markets[market_id] = {
                        'end_timestamp': end_timestamp,
                        'fpmm_address': fpmm_address
                    }
                    
                    # Log market info
                    current_status = "EXPIRED" if end_timestamp < current_time else "ACTIVE"
                    logger.info(f"📊 Market {market_id}: {current_status} - Ends in {end_timestamp - current_time} seconds")
                    
            except Exception as e:
                logger.error(f"❌ Failed to process market {market_id}: {e}")
        
        # Update our tracking
        self.active_markets = new_markets
        
        # Log summary
        logger.info(f"📈 Tracking {len(self.active_markets)} active markets")
        
        # Find expired markets
        expired_markets = []
        for market_id, market_info in self.active_markets.items():
            if (market_info['end_timestamp'] < current_time and 
                market_id not in self.resolved_markets):
                expired_markets.append((market_id, market_info))
        
        return expired_markets

    async def check_and_resolve_expired_markets(self):
        """Check for expired markets and resolve them"""
        logger.info("🔍 Checking for expired markets...")
        
        expired_markets = await self.update_active_markets()
        
        if not expired_markets:
            logger.info("✅ No expired markets found")
            return
        
        logger.info(f"🚨 Found {len(expired_markets)} expired markets")
        
        for market_id, market_info in expired_markets:
            resolution_time = market_info['end_timestamp'] + RESOLVE_DELAY
            current_time = int(time.time())
            
            if current_time >= resolution_time:
                logger.info(f"🎯 Market {market_id} is ready for resolution")
                
                try:
                    market_data = await self.get_market_data(market_id)
                    if market_data and await self.resolve_expired_market(market_id, market_data):
                        self.resolved_markets.add(market_id)
                        logger.info(f"✅ Successfully resolved market {market_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to resolve market {market_id}: {e}")
            else:
                time_until_resolution = resolution_time - current_time
                minutes_until = time_until_resolution // 60
                logger.info(f"⏰ Market {market_id} expires in {minutes_until} minutes")

    async def run_continuously(self):
        """Run the market monitor continuously"""
        logger.info(f"🔄 Starting continuous market monitoring every {CHECK_INTERVAL} seconds...")
        
        while True:
            try:
                logger.info(f"⏰ Running market check at {datetime.now()}")
                await self.check_and_resolve_expired_markets()
                logger.info(f"💤 Waiting {CHECK_INTERVAL/60} minutes before next check...")
                await asyncio.sleep(CHECK_INTERVAL)
            except KeyboardInterrupt:
                logger.info("👋 Market monitor interrupted by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in continuous execution: {e}")
                # Wait before retrying to avoid spamming on errors
                await asyncio.sleep(CHECK_INTERVAL)

    async def cleanup(self):
        """Clean up resources"""
        logger.info("🧹 Cleaning up market monitor...")
        await self.app_state.cleanup()


async def main():
    """Main function to start market monitoring"""
    monitor = MarketMonitor()
    
    try:
        await monitor.initialize()
        await monitor.run_continuously()
    except KeyboardInterrupt:
        logger.info("👋 Market monitor interrupted by user")
    except Exception as e:
        logger.error(f"❌ Market monitor failed: {e}")
        raise
    finally:
        await monitor.cleanup()


if __name__ == "__main__":
    import base64  # Add for base64 decoding
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
    except Exception as e:
        logger.error(f"❌ Script failed: {e}")
        exit(1)