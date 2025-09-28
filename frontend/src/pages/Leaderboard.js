import React from 'react';
import Header from '../components/Header';
import './Leaderboard.css';

/**
 * Leaderboard page for displaying top predictors.
 * All JSX elements are properly closed and nested.
 */
const Leaderboard = () => {
  // Static leaderboard data for demonstration
  const leaderboardData = [
    { rank: 1, ensName: 'xadahiya.eth', address: '0x4Aad34177373e264427954C5BAfA8F82e0e8e4d1', points: 15420, bets: 234 },
    { rank: 2, ensName: 'vitalik.eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', points: 15420, bets: 234 },
    { rank: 3, ensName: 'cryptoking.eth', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f9e2e8', points: 10230, bets: 167 },
    { rank: 4, ensName: 'wizard.eth', address: '0x3Aad34177373e264427954C5BAfA8F82e0e8e4d8', points: 8765, bets: 145 },
    { rank: 5, ensName: 'degenlord.eth', address: '0x8Ba1f109551bD432803012645Hac136c04D5cB29', points: 7432, bets: 123 },
    { rank: 6, ensName: null, address: '0x4f3dEfA5e1029A3CA4185A2A3A9E0b42D1a4bc42', points: 6980, bets: 112 },
    { rank: 7, ensName: 'ninja.eth', address: '0x2f9C40b599B51937C9Ba2eF9Fa8FAA41E143F86C', points: 5678, bets: 98 },
    { rank: 8, ensName: 'apollo.eth', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', points: 4321, bets: 76 },
    { rank: 9, ensName: null, address: '0x1234567890123456789012345678901234567890', points: 3456, bets: 67 },
    { rank: 10, ensName: 'zer0.eth', address: '0x9876543210987654321098765432109876543210', points: 2987, bets: 54 },
  ];

  // Returns a medal emoji for top 3, otherwise rank number
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  // Shortens Ethereum address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="leaderboard-page">
      <Header />
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h1>🏆 Leaderboard</h1>
          <p>Top predictors on I Was BORED</p>
        </div>
        <div className="leaderboard-stats">
          <div className="stat-item">
            <span className="stat-number">{leaderboardData.length}</span>
            <span className="stat-label">Active Players</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{leaderboardData.reduce((sum, user) => sum + user.bets, 0)}</span>
            <span className="stat-label">Total Bets</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{leaderboardData.reduce((sum, user) => sum + user.points, 0)}</span>
            <span className="stat-label">Total Points</span>
          </div>
        </div>
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="header-rank">Rank</div>
            <div className="header-ens">Player</div>
            <div className="header-address">Address</div>
            <div className="header-points">Points</div>
            <div className="header-bets">Bets</div>
          </div>
          <div className="table-body">
            {leaderboardData.map((user) => (
              <div key={user.rank} className="table-row">
                <div className="cell-rank">
                  <span className="rank-icon">{getRankIcon(user.rank)}</span>
                </div>
                <div className="cell-ens">
                  {user.ensName ? (
                    <span className="ens-name">{user.ensName}</span>
                  ) : (
                    <span className="no-ens">No ENS</span>
                  )}
                </div>
                <div className="cell-address">
                  <span className="address-text">{formatAddress(user.address)}</span>
                </div>
                <div className="cell-points">
                  <span className="points-number">{user.points.toLocaleString()}</span>
                </div>
                <div className="cell-bets">
                  <span className="bets-number">{user.bets}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="leaderboard-footer">
            <p>Updated recently • View all players</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;