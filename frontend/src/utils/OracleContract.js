import { useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import abi from './abi.json'; // Import the ABI
import { useCallback } from 'react'; // Import useCallback

// Define the Oracle contract address
const ORACLE_CONTRACT_ADDRESS = '0xC16a6c2720308DE8d7811428A18D3810513A677C';

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

  // Expose specific write functions for convenience
  const createMarket = useCallback((questionId, randomIndex, marketEndTimestamp, priceUpdateData, value = 0) =>
    write('createMarket', [questionId, randomIndex, marketEndTimestamp, priceUpdateData], value), [write]);

  const buyPosition = useCallback((questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver) =>
    write('buyPosition', [questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver]), [write]);

  const redeemPosition = useCallback((questionId, indexSets) =>
    write('redeemPosition', [questionId, indexSets]), [write]);

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
    createMarket,
    buyPosition,
    redeemPosition,
  };
};

export { abi, ORACLE_CONTRACT_ADDRESS };