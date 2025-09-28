import { useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import abi from './abi.json'; // Import the ABI
import { useCallback } from 'react'; // Import useCallback

// Define the Oracle contract address
const ORACLE_CONTRACT_ADDRESS = '0xEfeFbB5e484b384A6a31f07F862bDA4D21267De3';

/**
 * Generic hook to interact with any contract.
 * @param {string} contractAddress The address of the contract.
 * @param {Array} contractAbi The ABI of the contract.
 * @param {number} chainId The chain ID the contract is deployed on.
 * @returns {object} An object containing functions to read from and write to the contract.
 */
export const useContract = (contractAddress, contractAbi, chainId) => {
  const { writeContract, data: writeData, isLoading: isWriteLoading, isSuccess: isWriteSuccess, error: writeError } = useWriteContract();

  const write = useCallback((functionName, args = [], value = 0) => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: functionName,
      args: args,
      chainId: chainId,
      value: value,
    });
  }, [writeContract, contractAddress, contractAbi, chainId]); // Dependencies for useCallback

  const getReadConfig = useCallback((functionName, args = []) => ({
    address: contractAddress,
    abi: contractAbi,
    functionName: functionName,
    args: args,
    chainId: chainId,
  }), [contractAddress, contractAbi, chainId]); // Dependencies for useCallback

  return {
    getReadConfig,
    write,
    writeData,
    isWriteLoading,
    isWriteSuccess,
    writeError,
  };
};

/**
 * Specific hook for the Oracle contract.
 * Provides pre-configured access to the Oracle contract's functions.
 */
export const useOracleContract = () => {
  const { getReadConfig, write, writeData, isWriteLoading, isWriteSuccess, writeError } = useContract(
    ORACLE_CONTRACT_ADDRESS,
    abi,
    sepolia.id
  );

  // Expose specific read functions for convenience, now returning config for useReadContract
  const getOwnerConfig = useCallback(() => getReadConfig('owner'), [getReadConfig]);
  const getActiveMarketIdsConfig = useCallback(() => getReadConfig('getActiveMarketIds'), [getReadConfig]);
  const getMarketDataConfig = useCallback((questionId) => getReadConfig('getMarketData', [questionId]), [getReadConfig]);
  const getDetailedMarketDataConfig = useCallback((questionId) => getReadConfig('getDetailedMarketData', [questionId]), [getReadConfig]);
  const getUserOpenPositionsConfig = useCallback((userAddress) => getReadConfig('getUserOpenPositions', [userAddress]), [getReadConfig]);
  const getUserClosedPositionsConfig = useCallback((userAddress) => getReadConfig('getUserClosedPositions', [userAddress]), [getReadConfig]);
  const getUserSpendingsConfig = useCallback((userAddress) => getReadConfig('userSpendings', [userAddress]), [getReadConfig]);
  const getUserRedeemedConfig = useCallback((userAddress) => getReadConfig('userRedeemed', [userAddress]), [getReadConfig]);
  // Expose specific write functions for convenience
  const createMarket = useCallback((questionId, randomIndex, marketEndTimestamp, priceUpdateData, value = 0) =>
    write('createMarket', [questionId, randomIndex, marketEndTimestamp, priceUpdateData], value), [write]);

  const buyPosition = useCallback((questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver) =>
    write('buyPosition', [questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver]), [write]);

  const redeemPosition = useCallback((questionId, indexSets) =>
    write('redeemPosition', [questionId, indexSets]), [write]);

  const redeemPositions = useCallback((num) =>
    write('redeemPositions', [num]), [write]);

  return {
    getReadConfig,
    write,
    writeData,
    isWriteLoading,
    isWriteSuccess,
    writeError,

    getOwnerConfig,
    getActiveMarketIdsConfig,
    getMarketDataConfig,
    getDetailedMarketDataConfig,
    getUserOpenPositionsConfig,
    getUserClosedPositionsConfig,
    createMarket,
    buyPosition,
    redeemPosition,
    redeemPositions,
    getUserSpendingsConfig,
    getUserRedeemedConfig,
  };
};

export { abi, ORACLE_CONTRACT_ADDRESS };