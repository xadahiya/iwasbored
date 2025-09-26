import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import Logo from '../components/Logo';
import './Onboarding.css';

const Onboarding = () => {
  const { address, connectWallet, error } = useWallet();
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
      navigate('/swipe');
    }
  }, [address, navigate]);

  return (
    <div className="onboarding">
      <Logo />
      <h1 className="title">CryptoSwipe</h1>
      <p className="tagline">Swipe to Predict Crypto Prices & Win</p>
      <button onClick={handleConnectWallet} className="cta-button">Connect Wallet</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Onboarding;