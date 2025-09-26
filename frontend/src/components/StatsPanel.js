import React from 'react';
import './StatsPanel.css';

const StatsPanel = () => {
  return (
    <div className="stats-panel">
      <h2 className="stats-title">My Stats</h2>
      <div className="stats-item">
        <p className="stats-label">Total Bets</p>
        <p className="stats-value">10</p>
      </div>
      <div className="stats-item">
        <p className="stats-label">Winning Bets</p>
        <p className="stats-value">7</p>
      </div>
      <div className="stats-item">
        <p className="stats-label">Losing Bets</p>
        <p className="stats-value">3</p>
      </div>
      <div className="stats-item">
        <p className="stats-label">Win Rate</p>
        <p className="stats-value">70%</p>
      </div>
    </div>
  );
};

export default StatsPanel;
