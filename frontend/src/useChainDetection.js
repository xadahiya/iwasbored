import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';

export const useChainDetection = () => {
  const { chain, address, isConnected } = useAccount(); // Get address from useAccount
  const { chains, switchChain, error: switchChainError } = useSwitchChain();
  const [currentChain, setCurrentChain] = useState(null);
  const [isWrongChain, setIsWrongChain] = useState(false);

  useEffect(() => {
    console.log('useChainDetection useEffect triggered.');
    console.log('isConnected:', isConnected);
    console.log('chain:', chain);
    console.log('address:', address); // Log address

    if (isConnected) {
      if (chain) {
        setCurrentChain(chain.name);
        setIsWrongChain(false);
        console.log('Current chain:', chain.name);
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
  }, [chain, isConnected, address]); // Added address to dependency array

  // Log any errors from useSwitchChain (though we are bypassing it for now)
  useEffect(() => {
    if (switchChainError) {
      console.error('useSwitchChain error:', switchChainError);
    }
  }, [switchChainError]);

  return {
    chain,
    chains,
    currentChain,
    isWrongChain,
    switchChain,
  };
};