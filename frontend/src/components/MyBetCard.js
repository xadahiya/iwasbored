import React from 'react';
import { useReadContract } from 'wagmi';
import { useOracleContract } from '../utils/OracleContract';
import PredictionCard from './PredictionCard';

const MyBetCard = ({ bet }) => {
  const { getDetailedMarketDataConfig } = useOracleContract();
  const { data: prediction, isLoading, error } = useReadContract(getDetailedMarketDataConfig(bet.id));

  if (isLoading) return <div>Loading bet details...</div>;
  if (error) return <div>Error loading bet details: {error.message}</div>;
  if (!prediction) return null; // Or a placeholder

  // The BetCard component expects a 'prediction' prop
  // We need to transform the 'prediction' data from the contract into the format expected by BetCard
  // For now, let's assume the structure is compatible or needs minimal adjustment.
  // If BetCard expects more fields than available in 'prediction', we'll need to add them here.

  return (
    <PredictionCard prediction={prediction} />
  );
};

export default MyBetCard;