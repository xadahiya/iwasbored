import React, { createContext, useState, useContext } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    console.log('connectWallet called');
    console.log('window.ethereum available:', typeof window.ethereum !== 'undefined');
    console.log('window.ethereum object:', window.ethereum);
    
    if (window.ethereum) {
      try {
        // Request account access
        console.log('Attempting to request accounts...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Accounts received:', accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setError(null);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
        setError(err.message || 'Failed to connect wallet');
      }
    } else {
      console.error('MetaMask not installed');
      setError('Please install MetaMask or another Web3 wallet!');
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ address, error, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
