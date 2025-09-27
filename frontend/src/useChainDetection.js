import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'viem/chains';

export const useChainDetection = () => {
  const { chainId } = useAccount();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [currentChain, setCurrentChain] = useState(null);
  const [isWrongChain, setIsWrongChain] = useState(false);

  const supportedChains = {
    sepolia: 11155111,
  };

  const isSupportedChain = !!Object.entries(supportedChains).find(([_, id]) => id === chainId);

  const switchToSepolia = () => {
    switchChain && switchChain({ chainId: sepolia.id });
  };

  useEffect(() => {
    if (isConnected) {
      if (chainId) {
        const chainName = Object.entries(supportedChains).find(([_, id]) => id === chainId)?.[0];
        setCurrentChain(chainName);
        setIsWrongChain(false);
      } else {
        setCurrentChain(null);
        setIsWrongChain(true);
      }
    } else {
      setCurrentChain(null);
      setIsWrongChain(false);
    }
  }, [chainId, isConnected]);

  return {
    chainId,
    currentChain,
    isSupportedChain,
    isWrongChain,
    switchToSepolia,
    supportedChains,
    switchChain,
  };
};