import json
import os
from typing import Optional

import aiorwlock
from web3 import AsyncHTTPProvider
from web3 import AsyncWeb3
from dotenv import load_dotenv

from logger import logger

state_logger = logger.bind(
    service='I Was BORED|App State',
)


class AppState:
    """
    Manages the application state, including database connections, web3 instances,
    and contract interactions.
    """

    def __init__(self):
        self._rwlock = None
        self.w3 = None
        self.signer_account = None
        self.signer_pkey = None
        self.signer_nonce = None
        self.oracle_abi = None
        self.oracle_contract = None
        self.token_contract = None
        self.token_abi = None

        self.one_token = 10 ** 18

    async def initialize(self):
        """
        Initialize the application state.
        """
        # Load environment variables
        load_dotenv()
        
        self._rwlock = aiorwlock.RWLock()

        # Initialize Web3 instance
        infura_url = os.getenv("INFURA_URL", "https://sepolia.infura.io/v3/1c6b5e4765a341b29b9d77dd2549c025")
        self.w3 = AsyncWeb3(AsyncHTTPProvider(infura_url))
        await self._initialize_backend()

    async def _initialize_backend(self):
        """
        Initialize the main backend with contract interactions and balance checks.

        """
        # Load contract addresses and signer credentials from environment
        self.oracle_contract_address = os.getenv("ORACLE_CONTRACT_ADDRESS")
        self.token_contract_address = os.getenv("TOKEN_CONTRACT_ADDRESS")
        self.signer_account = os.getenv("SIGNER_ACCOUNT")
        self.signer_pkey = os.getenv("SIGNER_PRIVATE_KEY")
        
        # Validate required environment variables
        if not self.oracle_contract_address:
            raise ValueError("ORACLE_CONTRACT_ADDRESS environment variable is required")
        if not self.signer_account:
            raise ValueError("SIGNER_ACCOUNT environment variable is required")
        if not self.signer_pkey:
            raise ValueError("SIGNER_PRIVATE_KEY environment variable is required")

        # Load ABIs for various contracts
        try:
            self.oracle_abi = self._load_abi('static/oracle_abi.json')
            self.token_abi = self._load_abi('static/token_abi.json')
        except FileNotFoundError:
            raise FileNotFoundError("ABI files not found. Make sure static/oracle_abi.json and static/token_abi.json exist.")

        # Initialize contract instances
        self.oracle_contract = self.w3.eth.contract(
            address=self.oracle_contract_address, abi=self.oracle_abi,
        )
        self.token_contract = self.w3.eth.contract(
            address=self.token_contract_address, abi=self.token_abi,
        )

        # Get initial nonce for the signer account
        self.signer_nonce = await self.w3.eth.get_transaction_count(self.signer_account)

    def _load_abi(self, file_path):
        """
        Load ABI from a JSON file.

        Args:
            file_path (str): Path to the ABI JSON file.

        Returns:
            dict: Loaded ABI as a dictionary.
        """
        with open(file_path, 'r') as f:
            return json.load(f)


    async def cleanup(self):
        """
        Clean up shared resources when shutting down the application.
        """
        # Implement cleanup logic here (e.g., closing connections)
        pass
