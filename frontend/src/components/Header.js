import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import './Header.css';

const Header = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
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
          {isConnected ? (
            <>
              <span className="address-text">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
              <button onClick={() => disconnect()} className="disconnect-btn">Disconnect</button>
            </>
          ) : (
            <ConnectKitButton />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;