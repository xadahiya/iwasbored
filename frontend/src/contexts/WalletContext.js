import { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Check for MetaMask specifically
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to connect a wallet');
      }

      // Check if MetaMask is the wallet provider
      const isMetaMask = window.ethereum.isMetaMask;
      if (!isMetaMask) {
        throw new Error('Please use MetaMask wallet to connect');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setAddress(accounts[0]);
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setError(null);
  };

  return (
    <WalletContext.Provider value={{
      address,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};