import React from 'react';
import { FaEthereum, FaBitcoin, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <FaEthereum className="logo-icon eth" />
      <div className="logo-arrows">
        <FaArrowLeft className="logo-arrow left" />
        <FaArrowRight className="logo-arrow right" />
      </div>
      <FaBitcoin className="logo-icon btc" />
    </div>
  );
};

export default Logo;
