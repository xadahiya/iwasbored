import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'viem/chains';

export const useChainDetection = () => {
  const { chainId, address, isConnected } = useAccount(); // Get address from useAccount
  const { switchChain, error: switchChainError } = useSwitchChain();
  const [currentChain, setCurrentChain] = useState(null);
  const [isWrongChain, setIsWrongChain] = useState(false);

  const supportedChains = {
    sepolia: sepolia.id,
  };

  const isCurrentChainSupported = Object.values(supportedChains).includes(chainId);

  const switchToSepolia = async () => {
    console.log('Attempting to switch to Sepolia...');
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask (or other web3 wallet) is not installed.');
      return;
    }

    try {
      // Try to switch chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${sepolia.id.toString(16)}` }], // Chain ID must be in hexadecimal
      });
      console.log('Direct switch chain request sent to wallet.');
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        console.log('Sepolia not found in wallet, attempting to add it...');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${sepolia.id.toString(16)}`,
                chainName: sepolia.name,
                rpcUrls: sepolia.rpcUrls.default.http,
                nativeCurrency: sepolia.nativeCurrency,
                blockExplorerUrls: sepolia.blockExplorers?.default.url ? [sepolia.blockExplorers.default.url] : [],
              },
            ],
          });
          console.log('Sepolia added to wallet, attempting to switch again...');
          // After adding, try switching again
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
          });
        } catch (addError) {
          console.error('Error adding Sepolia to wallet:', addError);
        }
      } else {
        console.error('Error during chain switch (direct call):', switchError);
      }
    }
  };

  useEffect(() => {
    console.log('useChainDetection useEffect triggered.');
    console.log('isConnected:', isConnected);
    console.log('chainId:', chainId);
    console.log('address:', address); // Log address

    if (isConnected) {
      if (chainId && isCurrentChainSupported) {
        const chainName = Object.entries(supportedChains).find(([_, id]) => id === chainId)?.[0];
        setCurrentChain(chainName);
        setIsWrongChain(false);
        console.log('Current chain:', chainName);
        console.log('isWrongChain:', false);
      } else {
        setCurrentChain(null);
        setIsWrongChain(true);
        console.log('Chain ID is null or not supported, setting isWrongChain to true.');
        console.log('isWrongChain:', true);
      }
    } else {
      setCurrentChain(null);
      setIsWrongChain(false);
      console.log('Wallet not connected, setting isWrongChain to false.');
      console.log('isWrongChain:', false);
    }
  }, [chainId, isConnected, isCurrentChainSupported, address]); // Added address to dependency array

  // Log any errors from useSwitchChain (though we are bypassing it for now)
  useEffect(() => {
    if (switchChainError) {
      console.error('useSwitchChain error:', switchChainError);
    }
  }, [switchChainError]);

  return {
    chainId,
    currentChain,
    isSupportedChain: isCurrentChainSupported,
    isWrongChain,
    switchToSepolia,
    supportedChains,
    switchChain,
  };
};