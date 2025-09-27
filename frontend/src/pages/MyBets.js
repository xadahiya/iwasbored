import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useOracleContract } from '../utils/OracleContract';
import { useAccount, useReadContract } from 'wagmi';
import { ethers } from 'ethers';

import PredictionCard from '../components/PredictionCard';
import './MyBets.css';

const PYTH_PRICE_FEEDS = {
  "ETH": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "BTC": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "USDC": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  "SOL": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
};

const REVERSE_PYTH_PRICE_FEEDS = {
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace": "ETH",
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43": "BTC",
  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a": "USDC",
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL"
};


const MyBets = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('pendingRedemption');
  const [allBets, setAllBets] = useState([]); // Replaced global allBets with state
  const [filteredBets, setFilteredBets] = useState([]);
  const [userSpendingsValue, setUserSpendingsValue] = useState(0);
  const [userRedeemedValue, setUserRedeemedValue] = useState(0);
  const { getUserOpenPositionsConfig, getUserClosedPositionsConfig, redeemPositions, getUserSpendingsConfig, getUserRedeemedConfig } = useOracleContract();
  const { data: userOpenPositions, isLoading: isUserOpenPositionsLoading, error: userOpenPositionsError } = useReadContract({
    ...getUserOpenPositionsConfig(address),
    enabled: !!address,
  });
  const { data: userClosedPositions, isLoading: isUserClosedPositionsLoading, error: userClosedPositionsError } = useReadContract({
    ...getUserClosedPositionsConfig(address),
    enabled: !!address,
  });

  const { data: userSpendings, isLoading: isUserSpendingsLoading, error: userSpendingsError } = useReadContract(
    getUserSpendingsConfig(address),
    { enabled: !!address }
  );
  const { data: userRedeemed, isLoading: isUserRedeemedLoading, error: userRedeemedError } = useReadContract(
    getUserRedeemedConfig(address),
    { enabled: !!address }
  );

  console.log("User Spendings:", userSpendings, "Loading:", isUserSpendingsLoading, "Error:", userSpendingsError);
  console.log("User Redeemed:", userRedeemed, "Loading:", isUserRedeemedLoading, "Error:", userRedeemedError);

  const handleRedeemAll = useCallback(async () => {
    if (!address) {
      alert("Please connect your wallet to redeem positions.");
      return;
    }
    if (!userOpenPositions || userOpenPositions.length === 0) {
      alert("No open positions to redeem.");
      return;
    }

    try {
      for (const questionId of userOpenPositions) {
        // The indexSets parameter is complex and depends on the contract's implementation.
        // For a simple redeem all, we might need to pass a default or derive it.
        // Assuming for now that a simple call with questionId is sufficient or indexSets can be an empty array if not needed for a full market redeem.
        // If the contract requires specific indexSets for each position, this logic will need to be expanded.
        await redeemPositions(20); // Placeholder for indexSets
      }
    } catch (error) {
      console.error("Failed to redeem positions:", error);
      alert("Failed to redeem positions. See console for details.");
    }
  }, [address, userOpenPositions, redeemPositions]);

  console.log(userOpenPositions);
  console.log(userClosedPositions);

  const MarketDetailsFetcher = ({ bet }) => {
    const { getDetailedMarketDataConfig } = useOracleContract();
    const questionId = bet.id;
    const { data: marketDetails, isLoading, error } = useReadContract(getDetailedMarketDataConfig(questionId));
    console.log('Market Details:', marketDetails);
  
    if (isLoading) return <li>Loading details for {questionId}...</li>;
    if (error) return <li>Error loading details for {questionId}: {error.message}</li>;
  
    // Access questionData from the first element of the returned tuple
    const questionData = marketDetails ? marketDetails[0] : null;
    const tokenSymbol = REVERSE_PYTH_PRICE_FEEDS[questionData.priceFeedId];
    const currentTimestamp = Math.floor(Date.now() / 1000);
    // Ensure both operands are BigInt for safe subtraction and handle missing data gracefully
    const timeRemaining = questionData && questionData.endTimestamp
      ? Number(questionData.endTimestamp) - Number(currentTimestamp)
      : 0;

    const endTimeString = new Date(Number(questionData.endTimestamp) * 1000).toLocaleString();
    const isMarketActive = timeRemaining > 0;
    const data = {
      id: questionData.questionId,
      question: `${tokenSymbol} above $2,500 at ${endTimeString}`,
      initialPrice: questionData.initialPrice,
      finalPrice: questionData.finalPrice,
      stake: 0,
      title: tokenSymbol,
      icon: tokenSymbol,
      color: '#627eea',
      type: 'crypto',
      isMarketActive: isMarketActive,
      priceFeedId: questionData.priceFeedId,
      marketStartTimestamp: Number(questionData.beginTimestamp), // Pass actual timestamps
      marketEndTimestamp: Number(questionData.endTimestamp),     // Pass actual timestamps
      status: bet.status,
    }
    return (
      <PredictionCard prediction={data} />
    );
  };
  
  
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
    if (userOpenPositions && userClosedPositions) {
      const userOpenPositionsArray = userOpenPositions.map((position) => ({
        id: position,
        status: "pendingRedemption",
      }));
      const userClosedPositionsArray = userClosedPositions.map((position) => ({
        id: position,
        status: "redeemed",
      }));
      setAllBets([...userOpenPositionsArray, ...userClosedPositionsArray]);
    }
  }, [userOpenPositions, userClosedPositions, setAllBets]);

  useEffect(() => {
    if (userSpendings) {
      setUserSpendingsValue(ethers.formatEther(userSpendings));
    }
  }, [userSpendings]);
  useEffect(() => {
    if (userRedeemed) {
      setUserRedeemedValue(ethers.formatEther(userRedeemed));
    }
  }, [userRedeemed]);

  useEffect(() => {
      setFilteredBets(allBets.filter((bet) => bet.status === filter));
  }, [filter, allBets]);

  return (
    <div className="my-bets">
      <Header />
      <div className="user-stats-container">
        <div className="user-stat-card">
          <h3>Total Buys</h3>
          <p>{userSpendingsValue} <span className="eth-label">ETH</span></p>
        </div>
        <div className="user-stat-card">
          <h3>Total Earnings</h3>
          <p>{userRedeemedValue} <span className="eth-label">ETH</span></p>
        </div>
      </div>
      <div className="my-bets-content">
        <div className="filter-container">
          <button onClick={() => setFilter('pendingRedemption')} className={filter === 'pendingRedemption' ? 'active' : ''}>Pending Redemption</button>
          <button onClick={() => setFilter('redeemed')} className={filter === 'redeemed' ? 'active' : ''}>Redeemed</button>
        </div>
        <div className="bets-list">
          {filteredBets.map((bet) => (
            <MarketDetailsFetcher key={bet.id} bet={bet} />
          ))}
        </div>
      </div>
      <button className="redeem-all-button" onClick={handleRedeemAll}>Redeem All Positions</button>
    </div>
  );
};

export default MyBets;