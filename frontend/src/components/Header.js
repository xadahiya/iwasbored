import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useENS } from '../hooks/useENS';
import './Header.css';

const Header = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { ensName, loading } = useENS(address);
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span>🫩</span>
          <span>I Was BORED</span>
        </div>
        <nav className="nav-menu">
          <button className="nav-item active" onClick={() => navigate('/swipe')}>Discover</button>
          <button className="nav-item" onClick={() => navigate('/leaderboard')}>Leaderboard</button>
          <button className="nav-item" onClick={() => navigate('/my-bets')}>My Bets</button>
        </nav>
      </div>
      <div className="header-right">
        <div className="wallet-info">
          {isConnected ? (
            <>
              <span
                className="address-text"
                style={{
                  fontWeight: 'bold',
                  fontSize: '1.15rem',
                  color: '#fff',
                  background: 'linear-gradient(90deg, #ff9800 0%, #ff3d00 100%)',
                  padding: '6px 16px',
                  borderRadius: '18px',
                  boxShadow: '0 2px 12px rgba(255, 152, 0, 0.25), 0 1.5px 8px rgba(255, 61, 0, 0.15)',
                  letterSpacing: '0.04em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  border: '2px solid #fff',
                  display: 'inline-block',
                  marginRight: '12px',
                  transition: 'transform 0.1s',
                  transform: 'scale(1.08)'
                }}
              >
                {ensName
                  ? ensName.toUpperCase()
                  : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`.toUpperCase()}
              </span>
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