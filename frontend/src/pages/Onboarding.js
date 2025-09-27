import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Logo from '../components/Logo';
import './Onboarding.css';

const Onboarding = () => {
  const { address, isConnected } = useAccount();
  const { connect, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  console.log('Onboarding component rendered, address:', address);

  const handleConnectWallet = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Connect wallet button clicked');
    try {
      // Connect to the injected provider (e.g., MetaMask)
      connect({ connector: injected() });
    } catch (error) {
      console.error('Connection error:', error);
    }
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
      <h1 className="title">I Was BORED</h1>
      <p className="tagline">I was bored, so I made a prediction market.</p>
      {isConnected ? (
        <div className="wallet-connected">
          <p className="wallet-address">Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}</p>
          <button onClick={disconnect} className="disconnect-button">Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnectWallet} className="cta-button" disabled={pendingConnector}>
          {pendingConnector ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default Onboarding;