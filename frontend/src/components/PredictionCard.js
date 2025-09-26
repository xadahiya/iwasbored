import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import './PredictionCard.css';

const data = [
  { name: '5m', price: 2400 },
  { name: '4m', price: 2450 },
  { name: '3m', price: 2420 },
  { name: '2m', price: 2480 },
  { name: '1m', price: 2520 },
  { name: 'now', price: 2490 },
];

const PredictionCard = ({ prediction }) => {
  return (
    <div className="prediction-card">
      <div className="card-header">
        <div className="crypto-icon" style={{ backgroundColor: prediction.color }}>
          <span className="icon-text">{prediction.icon}</span>
        </div>
        <div className="crypto-info">
          <h2 className="crypto-title">{prediction.title}</h2>
          <p className="crypto-description">{prediction.description}</p>
        </div>
      </div>
      
      <div className="chart-section">
        <div className="price-info">
          <span className="current-price">$2,490</span>
          <span className="price-change">+2.5%</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <Line type="monotone" dataKey="price" stroke={prediction.color} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="prediction-section">
        <div className="prediction-question">
          {prediction.question}
        </div>
        <div className="stake-section">
          <div className="stake-info">
            <span>Your Stake</span>
            <span>${prediction.stake}</span>
          </div>
          <input type="range" className="stake-slider" min="0.10" max="10" step="0.10" defaultValue="0.10" />
        </div>
      </div>
      
      <div className="countdown-timer">
        <div className="timer-ring">
          <span className="timer-text">5:00</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
