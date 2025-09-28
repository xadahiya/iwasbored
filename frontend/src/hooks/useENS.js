
import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { mainnet } from 'wagmi/chains';

const addressCache = new Map();

export const useENS = (address) => {
  const [ensName, setENSName] = useState(null);
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient({ chainId: mainnet.id });

  useEffect(() => {
    const resolveENS = async () => {
      console.log('useENS: called with address:', address);
      console.log('useENS: publicClient available:', !!publicClient);
      
      if (!address || !publicClient) {
        console.log('useENS: no address or publicClient');
        return;
      }
      
      // Basic address validation
      if (!address || address.length !== 42 || !address.startsWith('0x')) {
        console.log('useENS: invalid address format:', address);
        return;
      }
      
      // Check cache first
      if (addressCache.has(address)) {
        const cachedName = addressCache.get(address);
        console.log('useENS: using cached name:', cachedName);
        setENSName(cachedName);
        return;
      }

      setLoading(true);
      try {
        console.log('useENS: fetching ENS name for:', address);
        const name = await publicClient.getEnsName({ address });
        console.log('useENS: resolved name:', name);
        if (name) {
          addressCache.set(address, name);
          setENSName(name);
        } else {
          setENSName(null);
        }
      } catch (error) {
        console.error('Error resolving ENS name:', error);
        setENSName(null);
      } finally {
        setLoading(false);
      }
    };

    resolveENS();
  }, [address, publicClient]);

  return { ensName, loading };
};
