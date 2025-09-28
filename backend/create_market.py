#!/usr/bin/env python3
"""
Python script to create markets by calling the backend /createMarket endpoint
"""
import random
import hashlib
import base64
import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Optional

import aiohttp
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PYTH_PRICE_FEEDS = ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
]


# Load environment variables
load_dotenv()

AUTH_TOKEN = "iwasbored"  # Same as backend


async def get_pyth_update_data(price_feed_id: str) -> list[str]:
    """Get Pyth update data from the Hermes API (exact same as Hardhat script)"""
    url = f"https://hermes.pyth.network/api/latest_vaas?ids[]={price_feed_id}"
    
    logger.info(f"Fetching Pyth data from: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                logger.info(f"Pyth API response status: {response.status}")
                if response.status == 200:
                    data = await response.text()
                    logger.info(f"Raw Pyth data: {data}")
                    
                    parsed = json.loads(data)
                    logger.info(f"Parsed Pyth data: {parsed}")
                    
                    price_update_data = ['0x' + base64.b64decode(d).hex() for d in parsed]
                    logger.info(f"Converted price update data: {price_update_data}")
                    return price_update_data
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to fetch Pyth data: {response.status} - {error_text}")
                    raise Exception(f"Failed to fetch Pyth data: {response.status} - {error_text}")
    except Exception as e:
        logger.error(f"Error fetching Pyth update data: {e}")
        raise


async def call_create_market_backend(url: str, market_data: dict) -> dict:
    """Call the backend /createMarket endpoint"""
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'Content-Type': 'application/json'}
            
            async with session.post(url, json=market_data, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Backend call successful: {result}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Backend call failed: {response.status} - {error_text}")
                    raise Exception(f"Backend call failed: {response.status} - {error_text}")
    except Exception as e:
        logger.error(f"❌ Error calling backend: {e}")
        raise


async def create_single_market():
    """Create a single market by calling backend (exact same as Hardhat script)"""
    logger.info("🎲 Creating a market via backend API...")
    
    # Backend URL (can be set via environment variable or hardcoded)
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000/initializeMarket')
    
    # Generate unique question ID (exact same as Hardhat script)
    timestamp_ms = int(datetime.now().timestamp() * 1000)
    question_id = '0x' + hashlib.sha256(f"market-{timestamp_ms}".encode()).hexdigest()
    logger.info(f"Generated Question ID: {question_id}")
    
    # Set market parameters (exact same as Hardhat script)
    random_index = random.randint(0, len(PYTH_PRICE_FEEDS) - 1)
    # Set end_timestamp randomly between 10 minutes and 6 hours from now
    min_offset = 10 * 60      # 10 minutes in seconds
    max_offset = 6 * 60 * 60  # 6 hours in seconds
    random_offset = random.randint(min_offset, max_offset)
    end_timestamp = int(datetime.now().timestamp()) + random_offset
    price_feed_id = PYTH_PRICE_FEEDS[random_index]
    
    logger.info(f"📞 Fetching Pyth update data for ETH/USD...")
    price_update_data = await get_pyth_update_data(price_feed_id)
    logger.info("✅ Pyth update data received.")
    
    # Create market data payload (exact same as Hardhat script expects: 0.001 ETH in wei)
    market_data = {
        "question_id": question_id,
        "random_index": random_index,
        "market_end_timestamp": end_timestamp,
        "price_update_data": price_update_data,
        "value": 10000000000,  # 0.001 ETH in wei (exactly same as Hardhat)
        "auth_token": AUTH_TOKEN
    }

    logger.info(f"Market data: {market_data}")
    
    logger.info("🚀 Calling backend /initializeMarket endpoint...")
    result = await call_create_market_backend(backend_url, market_data)
    
    if result.get('info', {}).get('success'):
        logger.info("✅ Market creation completed successfully!")
        logger.info(f"Response: {result}")
    else:
        logger.error(f"❌ Market creation failed: {result}")
    
    return result


async def run_continuously():
    """Run the market creation script continuously every 10 minutes"""
    interval = 10 * 60  # 10 minutes in seconds
    logger.info(f"🔄 Starting continuous market creation every {interval/60} minutes...")
    
    while True:
        try:
            await create_single_market()
            logger.info(f"⏰ Waiting {interval/60} minutes before creating next market...")
            await asyncio.sleep(interval)
        except KeyboardInterrupt:
            logger.info("Script interrupted by user")
            break
        except Exception as e:
            logger.error(f"❌ Error in continuous execution: {e}")
            logger.info(f"⏰ Retrying in {interval/60} minutes...")
            await asyncio.sleep(interval)


async def main():
    """Main function to start continuous market creation"""
    logger.info("🎲 Starting continuous market creator...")
    await run_continuously()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
    except Exception as e:
        logger.error(f"❌ Script failed: {e}")
        sys.exit(1)