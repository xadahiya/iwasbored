import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { address, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span>◈</span>
          <span>CryptoSwipe</span>
        </div>
        <nav className="nav-menu">
          <button className="nav-item active" onClick={() => navigate('/swipe')}>Discover</button>
          <button className="nav-item" onClick={() => navigate('/my-bets')}>My Bets</button>
        </nav>
      </div>
      <div className="header-right">
        <div className="wallet-info">
          {address ? (
            <>
              <span className="address-text">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
              <button onClick={disconnectWallet} className="disconnect-btn">Disconnect</button>
            </>
          ) : (
            <button onClick={() => navigate('/')} className="connect-btn">Connect Wallet</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
