import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import Logo from '../components/Logo';
import './Onboarding.css';

const Onboarding = () => {
  const { address, isConnected, connectWallet, disconnectWallet, isPending, error } = useWallet();
  const navigate = useNavigate();

  console.log('Onboarding component rendered, address:', address, 'error:', error);

  const handleConnectWallet = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Connect wallet button clicked');
    console.log('window.ethereum available:', typeof window.ethereum !== 'undefined');
    connectWallet();
  };

  useEffect(() => {
    console.log('Address changed:', address);
    if (address) {
      // Check if user is already age verified
      const isVerified = localStorage.getItem(`verified_${address}`);
      if (isVerified === 'true') {
        navigate('/swipe');
      } else {
        navigate('/verify-age');
      }
    }
  }, [address, navigate]);

  return (
    <div className="onboarding">
      <Logo />
      <h1 className="title">CryptoSwipe</h1>
      <p className="tagline">Swipe to Predict Crypto Prices & Win</p>
      {isConnected ? (
        <div className="wallet-connected">
          <p className="wallet-address">Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}</p>
          <button onClick={disconnectWallet} className="disconnect-button">Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnectWallet} className="cta-button" disabled={isPending}>
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Onboarding;