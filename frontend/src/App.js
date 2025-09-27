import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import AgeVerification from './pages/AgeVerification';
import Swipe from './pages/Swipe';
import MyBets from './pages/MyBets';
import { WalletProvider } from './wagmiProvider';
import { useChainDetection } from './useChainDetection';
import { useAccount, useSwitchChain } from 'wagmi'; // Import useSwitchChain
import './App.css';

// New component to handle chain detection and routing
const AppContent = () => {
  const { isConnected } = useAccount();
  const { isWrongChain, switchToSepolia } = useChainDetection();
  const { switchChain, status, error } = useSwitchChain(); // Get status and error from useSwitchChain

  useEffect(() => {
    console.log('AppContent useEffect triggered.');
    console.log('isConnected:', isConnected);
    console.log('isWrongChain:', isWrongChain);
    console.log('useSwitchChain status:', status);
    console.log('useSwitchChain error:', error);

    if (isConnected && isWrongChain) {
      console.log('Attempting automatic chain switch...');
      switchToSepolia(); // Automatically switch chain
    }
  }, [isConnected, isWrongChain, switchToSepolia, status, error]); // Added status and error to dependency array

  if (isConnected && isWrongChain) {
    return (
      <div className="app-wrong-chain">
        <h1>Switching Network...</h1>
        <p>Please approve the network switch in your wallet.</p>
        {status === 'pending' && <p>Waiting for wallet confirmation...</p>}
        {status === 'error' && <p>Error switching network: {error?.message}</p>}
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/verify-age" element={<AgeVerification />} />
          <Route path="/swipe" element={<Swipe />} />
          <Route path="/my-bets" element={<MyBets />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppContent /> {/* Render the new component inside WalletProvider */}
    </WalletProvider>
  );
}

export default App;