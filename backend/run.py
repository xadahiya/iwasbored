#!/usr/bin/env python3
"""
Main entry point for the IWasBored backend service.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from backend import app

def main():
    """Run the FastAPI application."""
    import uvicorn
    
    load_dotenv()
    # Load environment variables
    os.environ.setdefault("ENVIRONMENT", "dev")
    
    # Configuration based on environment
    env = os.getenv("ENVIRONMENT", "dev")
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    reload = env == "dev"
    
    # Validate environment variables
    required_vars = ["INFURA_URL", "ORACLE_CONTRACT_ADDRESS", "SIGNER_ACCOUNT", "SIGNER_PRIVATE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file or set these environment variables.")
        sys.exit(1)
    
    # Log startup information
    print(f"🚀 Starting backend in {env} mode")
    print(f"📍 Host: {host}:{port}")
    print(f"🔗 Web3 Provider: {os.getenv('INFURA_URL', 'N/A')}")
    print(f"📱 Oracle Contract: {os.getenv('ORACLE_CONTRACT_ADDRESS', 'N/A')[:10]}...")
    
    # Run the application
    uvicorn.run(
        "backend:app",
        host=host,
        port=port,
        reload=reload,
    )

if __name__ == "__main__":
    main()