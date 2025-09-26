import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Swipe from './pages/Swipe';
import MyBets from './pages/MyBets';
import { WalletProvider } from './contexts/WalletContext';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/swipe" element={<Swipe />} />
            <Route path="/my-bets" element={<MyBets />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;