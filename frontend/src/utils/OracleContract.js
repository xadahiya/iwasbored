import { useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import abi from './abi.json'; // Import the ABI

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
  // For writes, useWriteContract is called at the top level of the hook.
  const { writeContract, data: writeData, isLoading: isWriteLoading, isSuccess: isWriteSuccess, error: writeError } = useWriteContract();

  const write = (functionName, args = [], value = 0) => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: functionName,
      args: args,
      chainId: chainId,
      value: value,
    });
  };

  // The 'getReadConfig' function will now be a helper that returns the parameters for useReadContract
  const getReadConfig = (functionName, args = []) => ({
    address: contractAddress,
    abi: contractAbi,
    functionName: functionName,
    args: args,
    chainId: chainId,
  });

  return {
    getReadConfig, // Return a function to get read config for useReadContract
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
  const getOwnerConfig = () => getReadConfig('owner');
  const getActiveMarketIdsConfig = () => getReadConfig('getActiveMarketIds');
  const getMarketDataConfig = (questionId) => getReadConfig('getMarketData', [questionId]);
  const getDetailedMarketDataConfig = (questionId) => getReadConfig('getDetailedMarketData', [questionId]);

  // Expose specific write functions for convenience
  const createMarket = (questionId, randomIndex, marketEndTimestamp, priceUpdateData, value = 0) =>
    write('createMarket', [questionId, randomIndex, marketEndTimestamp, priceUpdateData], value);

  const buyPosition = (questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver) =>
    write('buyPosition', [questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver]);

  const redeemPosition = (questionId, indexSets) =>
    write('redeemPosition', [questionId, indexSets]);

  return {
    // Generic read/write access
    getReadConfig, // Expose generic read config getter
    write,
    writeData,
    isWriteLoading,
    isWriteSuccess,
    writeError,

    // Specific Oracle contract functions (now returning config for useReadContract)
    getOwnerConfig,
    getActiveMarketIdsConfig,
    getMarketDataConfig,
    getDetailedMarketDataConfig,
    createMarket,
    buyPosition,
    redeemPosition,
  };
};

// You can also export the ABI and address directly if needed elsewhere
export { abi, ORACLE_CONTRACT_ADDRESS };