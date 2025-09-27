import React from 'react';
import './BetCard.css';

const BetCard = ({ bet }) => {
  const bgColor = bet.status === 'active' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 
                   bet.outcome === 'win' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 
                   'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  const cryptoIcon = getCryptoIcon(bet.question);
  const cryptoName = getCryptoName(bet.question);

  return (
    <div className="bet-card">
      <div className="bet-header" style={{ background: bgColor }}>
        <div className="crypto-icon-small">
          <span>{cryptoIcon}</span>
        </div>
        <div className="crypto-name">
          <h3>{cryptoName}</h3>
          <p className="bet-status-text">
            {bet.status === 'active' ? 'Active' : `Resolved: ${bet.outcome}`}
          </p>
        </div>
        <div className="stake-amount">
          ${bet.stake}
        </div>
      </div>
      <div className="bet-content">
        <div className="bet-question">
          {bet.question}
        </div>
        <div className="bet-details">
          <div className="detail-row">
            <span className="label">Time Remaining</span>
            <span className="value">5:00</span>
          </div>
          <div className="detail-row">
            <span className="label">Potential Winnings</span>
            <span className="value">${(bet.stake * 1.9).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function getCryptoIcon(question) {
  if (question.includes('ETH') || question.includes('Ethereum')) return '◈';
  if (question.includes('BTC') || question.includes('Bitcoin')) return '₿';
  if (question.includes('DOGE') || question.includes('Dogecoin')) return 'Ð';
  return '💰';
}

function getCryptoName(question) {
  if (question.includes('ETH') || question.includes('Ethereum')) return 'Ethereum';
  if (question.includes('BTC') || question.includes('Bitcoin')) return 'Bitcoin';
  if (question.includes('DOGE') || question.includes('Dogecoin')) return 'Dogecoin';
  return 'Crypto';
}

export default BetCard;
