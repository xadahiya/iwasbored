# Get the chain ID from the settings
CHAIN_ID = "11155111"


async def write_transaction(
    w3, address, private_key, contract, function, nonce, *args,
):
    """ Writes a transaction to the blockchain

    This function creates and sends a transaction to the blockchain using the provided parameters.

    Args:
        w3 (web3.Web3): Web3 object for interacting with the Ethereum blockchain
        address (str): The address of the account sending the transaction
        private_key (str): The private key of the account sending the transaction
        contract (web3.eth.contract): Web3 contract object to interact with
        function (str): The name of the function to call on the contract
        nonce (int): The transaction count of the account
        *args: Variable length argument list for the function parameters

    Returns:
        str: The transaction hash as a hexadecimal string
    """

    # Create the function object from the contract
    func = getattr(contract.functions, function)

    # Build the transaction dictionary
    transaction = await func(*args).build_transaction({
        'from': address,
        'gas': 10000000,  # Set gas limit
        'maxFeePerGas': w3.to_wei('0.02', 'gwei'),  # Set max fee per gas
        'nonce': nonce,
    })

    # Sign the transaction with the private key
    # ref: https://web3py.readthedocs.io/en/v5/web3.eth.html#web3.eth.Eth.send_raw_transaction
    signed_transaction = w3.eth.account.sign_transaction(
        transaction, private_key,
    )

    # Send the raw transaction to the network
    tx_hash = await w3.eth.send_raw_transaction(signed_transaction.rawTransaction)

    # Return the transaction hash as a hexadecimal string
    return tx_hash.hex()


async def write_payable_transaction(
    w3, address, private_key, contract, function, nonce, value=0, *args,
):
    """ Writes a payable transaction to the blockchain

    This function creates and sends a payable transaction to the blockchain,
    allowing for the transfer of Ether along with the function call.

    Args:
        w3 (web3.Web3): Web3 object for interacting with the Ethereum blockchain
        address (str): The address of the account sending the transaction
        private_key (str): The private key of the account sending the transaction
        contract (web3.eth.contract): Web3 contract object to interact with
        function (str): The name of the function to call on the contract
        nonce (int): The transaction count of the account
        value (int): The amount of Ether to send with the transaction (in wei)
        *args: Variable length argument list for the function parameters

    Returns:
        str: The transaction hash as a hexadecimal string
    """
    # Create the function object from the contract
    func = getattr(contract.functions, function)

    # Build the transaction dictionary, including the value to be sent
    transaction = await func(*args).build_transaction({
        'from': address,
        'value': value,
        'gas': 10000000,  # Set gas limit
        'maxFeePerGas': w3.to_wei('0.02', 'gwei'),  # Set max fee per gas
        'nonce': nonce,
    })

    # Sign the transaction with the private key
    signed_transaction = w3.eth.account.sign_transaction(
        transaction, private_key,
    )

    # Send the raw transaction to the network
    tx_hash = await w3.eth.send_raw_transaction(signed_transaction.rawTransaction)

    # Return the transaction hash as a hexadecimal string
    return tx_hash.hex()


async def write_transaction_with_receipt(w3, address, private_key, contract, function, nonce, gas_price, priority_gas_multiplier, *args):
    """ Writes a transaction using write_transaction, waits for confirmation, and returns the receipt

    This function sends a transaction and waits for it to be mined, returning both
    the transaction hash and the transaction receipt.

    Args:
        w3 (web3.Web3): Web3 object for interacting with the Ethereum blockchain
        address (str): The address of the account sending the transaction
        private_key (str): The private key of the account sending the transaction
        contract (web3.eth.contract): Web3 contract object to interact with
        function (str): The name of the function to call on the contract
        nonce (int): The transaction count of the account
        gas_price (int): The gas price for the transaction
        priority_gas_multiplier (float): Multiplier for the gas price to determine priority
        *args: Variable length argument list for the function parameters

    Returns:
        tuple: A tuple containing the transaction hash (str) and the transaction receipt (dict)
    """
    # Send the transaction
    tx_hash = await write_transaction(
        w3, address, private_key, contract, function, nonce, gas_price, priority_gas_multiplier, *args,
    )

    # Wait for the transaction to be mined and get the receipt
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)

    # Return both the transaction hash and the receipt
    return tx_hash, receipt
