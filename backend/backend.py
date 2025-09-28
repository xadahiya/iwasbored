import uuid
from typing import Any
from typing import Dict
from typing import Optional

from fastapi import FastAPI
from fastapi import Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tenacity import retry
from tenacity import retry_if_exception_type
from tenacity import stop_after_attempt
from tenacity import wait_random_exponential
import asyncio
from app_state import AppState
from logger import logger
from transaction_utils import write_payable_transaction
from pydantic import BaseModel
from fastapi import HTTPException
from fastapi import Response
import json
import time

AUTH_TOKEN = "iwasbored"

# Initialize logger for this service
service_logger = logger.bind(
    service='IWasBored|Backend',
)

class MarketInfo(BaseModel):
    question_id: str
    random_index: int
    market_end_timestamp: int
    price_update_data: list[str]
    value: int
    auth_token: str

class ResolveMarketMessage(BaseModel):
    question_id: str
    price_update_data: list[str]
    answer_cid: str
    value: int
    auth_token: str


def create_app():
    # Create FastAPI application instance
    app = FastAPI()
    app.logger = service_logger
    
    # Initialize application state
    app.state = AppState()
    
    # Setup CORS
    origins = ['*']
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    
    return app

app = create_app()


@app.middleware('http')
async def request_middleware(request: FastAPIRequest, call_next: Any) -> Optional[Dict]:
    """
    Middleware to handle incoming HTTP requests.

    This middleware:
    1. Generates a unique request ID
    2. Logs the start and end of each request
    3. Catches and logs any exceptions
    4. Adds the request ID to the response headers

    Args:
        request (FastAPIRequest): The incoming request object
        call_next (Any): The next function in the middleware chain

    Returns:
        Optional[Dict]: The response from the next middleware or route handler
    """
    # Generate a unique request ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    # Use contextualized logging
    with service_logger.contextualize(request_id=request_id):
        service_logger.info('Request started for: {}', request.url)
        try:
            # Call the next middleware or route handler
            response = await call_next(request)

        except Exception as ex:
            # Log any exceptions that occur during request processing
            service_logger.opt(exception=True).error(f'Request failed: {ex}')

            # Return a JSON response for internal server errors
            response = JSONResponse(
                content={
                    'info':
                        {
                            'success': False,
                            'response': 'Internal Server Error',
                        },
                    'request_id': request_id,
                }, status_code=500,
            )

        finally:
            # Add the request ID to the response headers
            response.headers['X-Request-ID'] = request_id
            service_logger.info('Request ended')
            return response


@app.on_event('startup')
async def startup_event():
    """
    Startup event handler for the FastAPI application.

    This function is called when the application starts up.
    It initializes the application state with the provided settings.
    """
    await app.state.initialize()


@app.on_event('shutdown')
async def shutdown_event():
    """
    Shutdown event handler for the FastAPI application.

    This function is called when the application is shutting down.
    It performs cleanup operations for the application state.
    """
    await app.state.cleanup()

@retry(
    reraise=True,
    retry=retry_if_exception_type(Exception),
    wait=wait_random_exponential(multiplier=1, max=10),
    stop=stop_after_attempt(3),
)
async def initilize_market_on_contract(
    request: FastAPIRequest, payload: MarketInfo,
):
    """
    Initialize a new market on the contract.

    Args:
        request (FastAPIRequest): The FastAPI request object.
        payload (MarketInfo): The market information payload.

    Returns:
        tuple: A tuple containing a boolean indicating success and a message.
    """
    async with request.app.state._rwlock.writer_lock:
        _nonce = request.app.state.signer_nonce
        try:
            tx_hash = await write_payable_transaction(
                request.app.state.w3,
                request.app.state.signer_account,
                request.app.state.signer_pkey,
                request.app.state.oracle_contract,
                'createMarket',
                _nonce,
                payload.value,
                payload.question_id,
                payload.random_index,
                payload.market_end_timestamp,
                payload.price_update_data,
            )

            request.app.state.signer_nonce += 1
            service_logger.info(
                f'submitted transaction with tx_hash: {tx_hash}',
            )

        except Exception as e:
            service_logger.error(f'Exception: {e}')

            if 'nonce' in str(e):
                # Reset nonce if there's a nonce-related error
                await asyncio.sleep(10)
                request.app.state.signer_nonce = await request.app.state.w3.eth.get_transaction_count(
                    request.app.state.signer_account,
                )
                service_logger.info(
                    f'nonce reset to: {request.app.state.signer_nonce}',
                )
                raise Exception('nonce error, reset nonce')
            else:
                raise e

    receipt = await request.app.state.w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt['status'] == 0:
        service_logger.info(
            f'tx_hash: {tx_hash} failed, receipt: {receipt}, '
            f'question_id: {payload.question_id}',
        )
        return False, f'tx failed for question_id: {payload.question_id}'
    else:
        service_logger.info(
            f'tx_hash: {tx_hash} succeeded!, question_id: {payload.question_id}',
        )
        return True, (
            f'tx_hash: {tx_hash} succeeded!, question_id: {payload.question_id}'
        )


@retry(
    reraise=True,
    retry=retry_if_exception_type(Exception),
    wait=wait_random_exponential(multiplier=1, max=10),
    stop=stop_after_attempt(3),
)
async def resolve_market_on_contract(
    request: FastAPIRequest, payload: ResolveMarketMessage,
):
    """
    Resolve a market on the contract.

    Args:
        request (FastAPIRequest): The FastAPI request object.
        payload (ResolveMarketMessage): The resolve market message.

    Returns:
        tuple: A tuple containing a boolean indicating success, the transaction hash, and a message.
    """
    async with request.app.state._rwlock.writer_lock:
        _nonce = request.app.state.signer_nonce
        try:
            tx_hash = await write_payable_transaction(
                request.app.state.w3,
                request.app.state.signer_account,
                request.app.state.signer_pkey,
                request.app.state.oracle_contract,
                'resolveMarket',
                _nonce,
                payload.value,
                payload.question_id,
                payload.price_update_data,
                payload.answer_cid,
            )

            request.app.state.signer_nonce += 1
            service_logger.info(
                f'submitted transaction with tx_hash: {tx_hash}',
            )

        except Exception as e:
            service_logger.error(f'Exception: {e}')

            if 'nonce' in str(e):
                # Reset nonce if there's a nonce-related error
                await asyncio.sleep(10)
                request.app.state.signer_nonce = await request.app.state.w3.eth.get_transaction_count(
                    request.app.state.signer_account,
                )
                service_logger.info(
                    f'nonce reset to: {request.app.state.signer_nonce}',
                )
                raise Exception('nonce error, reset nonce')
            else:
                raise e

    receipt = await request.app.state.w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt['status'] == 0:
        service_logger.info(
            f'tx_hash: {tx_hash} failed, receipt: {receipt}, '
            f'question_id: {payload.question_id}',
        )
        return False, tx_hash, f'tx failed for question_id: {payload.question_id}'
    else:
        service_logger.info(
            f'tx_hash: {tx_hash} succeeded!, question_id: {payload.question_id}',
        )
        return True, tx_hash, (
            f'tx_hash: {tx_hash} succeeded!, question_id: {payload.question_id}'
        )


@app.post('/resolveMarket')
async def resolve_market(
    request: FastAPIRequest, req_parsed: ResolveMarketMessage, response: Response,
):
    """
    Resolve a market.

    Args:
        request (FastAPIRequest): The FastAPI request object.
        req_parsed (ResolveMarketMessage): The parsed request message.
        response (Response): The FastAPI response object.

    Returns:
        dict: A dictionary containing the resolution result.
    """
    if req_parsed.auth_token != AUTH_TOKEN:
        raise HTTPException(
            status_code=401,
            detail={
                'info': {
                    'success': False,
                    'response': 'Incorrect Token!',
                },
                'request_id': request.state.request_id,
            },
        )

    try:
        status, tx_hash, message = await resolve_market_on_contract(request, req_parsed)
        if status:
            return {
                'info': {
                    'success': True,
                    'response': message,
                },
                'request_id': request.state.request_id,
            }
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    'info': {
                        'success': False,
                        'response': message,
                    },
                    'request_id': request.state.request_id,
                },
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail={
                'info': {
                    'success': False,
                    'response': str(e),
                },
                'request_id': request.state.request_id,
            },
        )



@app.post('/initializeMarket')
async def initialize_market(
    request: FastAPIRequest,
    req_parsed: MarketInfo,
    response: Response,
):
    """
    Initialize a new prediction market.

    This function handles the creation of a new market, including:
    - Validating the request
    - Creating the market on-chain (if not a dummy market)
    - Storing market data in Redis
    - Optionally posting about the new market on Farcaster

    Args:
        request (FastAPIRequest): The FastAPI request object.
        req_parsed (InitializeMarketMessage): Parsed request data containing market details.
        response (Response): The FastAPI response object.

    Returns:
        dict: A dictionary containing the result of the market initialization.
    """

    # Validate the authentication token
    if req_parsed.auth_token != AUTH_TOKEN:
        raise HTTPException(
            status_code=401,
            detail={
                'info': {
                    'success': False,
                    'response': 'Incorrect Token!',
                },
                'request_id': request.state.request_id,
            },
        )
    try:
        # Initialize the market on-chain
        status, message = await initilize_market_on_contract(request, req_parsed)
        if status:
            return {
                'info': {
                    'success': True,
                    'response': message,
                },
                'request_id': request.state.request_id,
            }
        else:
            return {
                'info': {
                    'success': False,
                    'response': message,
                },
                'request_id': request.state.request_id,
            }
    except Exception as e:
        service_logger.opt(exception=True).error(f'Exception: {e}')
        # Return error response if initialization fails
        raise HTTPException(
            status_code=500,
            detail={
                'info': {
                    'success': False,
                    'response': f'Failed to initialize: {e}',
                },
                'request_id': request.state.request_id,
            },
        )


