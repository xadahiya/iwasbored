import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import Header from '../components/Header';
import BetCard from '../components/BetCard';
import './MyBets.css';

const allBets = [
  { id: 1, question: 'ETH above $2,500 in 5 mins?', stake: 10, status: 'resolved', outcome: 'win' },
  { id: 2, question: 'BTC above $30,000 in 10 mins?', stake: 5, status: 'resolved', outcome: 'loss' },
  { id: 3, question: 'DOGE above $0.15 in 2 mins?', stake: 2, status: 'active', outcome: null },
  { id: 4, question: 'ETH above $2,600 in 1 hour?', stake: 20, status: 'active', outcome: null },
  { id: 5, question: 'BTC below $29,000 in 30 mins?', stake: 15, status: 'resolved', outcome: 'win' },
];

const MyBets = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [filteredBets, setFilteredBets] = useState(allBets);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
    
    // Check if user is age verified
    const isVerified = localStorage.getItem(`verified_${address}`);
    if (isVerified !== 'true') {
      navigate('/verify-age');
      return;
    }
  }, [address, navigate]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredBets(allBets);
    } else {
      setFilteredBets(allBets.filter((bet) => bet.status === filter));
    }
  }, [filter]);

  return (
    <div className="my-bets">
      <Header />
      <div className="my-bets-content">
        <div className="filter-container">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>Active</button>
          <button onClick={() => setFilter('resolved')} className={filter === 'resolved' ? 'active' : ''}>Resolved</button>
        </div>
        <div className="bets-list">
          {filteredBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyBets;