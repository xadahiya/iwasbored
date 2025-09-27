import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import Header from '../components/Header';
import PredictionCard from '../components/PredictionCard';
import { useSprings, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { useOracleContract } from '../utils/OracleContract';
import { usePYUSDToken } from '../utils/useERC20Token';
import { ethers } from 'ethers';
import './Swipe.css';

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

const to = (i) => ({
  x: 0,
  y: 0,
  rot: 0,
  rotZ: 0,
  scale: 1,
  opacity: 1,
  delay: i * 50,
  config: { tension: 120, friction: 14 }
});

const from = (i) => ({
  x: 0,
  y: 0,
  rot: 0,
  rotZ: 0,
  scale: 1,
  opacity: 0
});

const MarketDetailsFetcher = ({ questionId }) => {
  const { getDetailedMarketDataConfig } = useOracleContract();
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
  const isMarketActive = timeRemaining > 0;
  const timeRemainingMinutes = Math.floor(timeRemaining / 60);
  const data = {
    id: questionData.questionId,
    question: `${tokenSymbol} above $2,500 in ${timeRemainingMinutes} mins?`,
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
  }
  return (
    <PredictionCard prediction={data} />
  );
};


const Swipe = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [gone] = useState(() => new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(0.1); // Managed in Swipe.js
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const ORACLE_CONTRACT_ADDRESS = '0x29471e7732F79E9A5f9e1ca09Cc653f53928742F'; // Oracle contract address

  // Use the Oracle contract hook to get read configs and write functions
  const { getOwnerConfig, getActiveMarketIdsConfig, buyPosition, isWriteLoading, writeError, writeData } = useOracleContract();
  const { getAllowanceConfig, approve } = usePYUSDToken();

  const { data: allowance, isLoading: isAllowanceLoading, refetch: refetchAllowance } = useReadContract(
    getAllowanceConfig(address, ORACLE_CONTRACT_ADDRESS),
    { enabled: !!address }
  );

  useEffect(() => {
    if (allowance !== undefined && address) {
      const requiredAllowance = ethers.parseEther(stakeAmount.toString()); 
      setNeedsApproval(allowance < requiredAllowance);
    }
  }, [allowance, address, stakeAmount]);

  // Fetch the contract owner
  const { data: owner, isLoading: isOwnerLoading, error: ownerError } = useReadContract(getOwnerConfig());

  // Fetch all active market IDs
  const { data: activeMarketIds, isLoading: isActiveMarketIdsLoading, error: activeMarketIdsError } = useReadContract(getActiveMarketIdsConfig());

  // Conditionally initialize useSprings only when activeMarketIds is available
  const [props, set] = useSprings(activeMarketIds ? activeMarketIds.length : 0, (i) => ({
    ...to(i),
    from: from(i)
  }));
  const cardRef = useRef(null);

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

  // Log the owner when it's loaded
  useEffect(() => {
    if (owner) {
      console.log('Oracle Contract Owner:', owner);
    }
    if (ownerError) {
      console.error('Error loading Oracle Contract Owner:', ownerError);
    }
  }, [owner, ownerError]);

  // Log transaction status and show alerts
  useEffect(() => {
    if (isWriteLoading) {
      console.log('Buy position transaction is loading...');
    }
    if (writeError) {
      console.error('Error buying position:', writeError);
      alert(`Transaction failed: ${writeError.message}`); // Show alert for error
    }
  }, [isWriteLoading, writeError]);

  const handleApprove = async () => {
    if (!address) {
      alert("Please connect your wallet to approve.");
      return;
    }
    setIsApproving(true);
    try {
      const amountToApprove = ethers.MaxUint256; // Approve a very large amount
      await approve(ORACLE_CONTRACT_ADDRESS, amountToApprove);
      // After approval, refetch allowance to update UI
      await refetchAllowance();
      setNeedsApproval(false); // Assuming approval was successful
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. See console for details.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwipe = async (direction) => { // Made async
    const currentCardIndex = currentIndex;
    if (currentCardIndex >= (activeMarketIds ? activeMarketIds.length : 0) || isAnimating) return;

    if (needsApproval) {
      alert("Please approve the PYUSD token spending first.");
      return;
    }

    const questionId = activeMarketIds[currentCardIndex]; // Get the questionId for the current card
    const outcomeIndex = direction === 'right' ? 1 : 0; // 1 for Yes, 0 for No (assuming binary outcomes)
    const amount = Number(Math.floor(stakeAmount * 1e6)); // Convert stakeAmount to BigInt with 18 decimals
    const minOutcomeTokensToBuy = Number(0); // Assuming 0 for now, can be made dynamic
    const conditionTokensReceiver = address; // The connected wallet address

    console.log(`Attempting to buy position: questionId=${questionId}, outcomeIndex=${outcomeIndex}, amount=${amount.toString()}, receiver=${conditionTokensReceiver}`);

    try {
      await buyPosition(questionId, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver);
      console.log('buyPosition transaction initiated.');
    } catch (error) {
      console.error('Failed to initiate buyPosition transaction:', error);
      // The alert for error is now handled in the useEffect above
    }

    setIsAnimating(true);
    const dir = direction === 'right' ? 1 : -1;
    gone.add(currentCardIndex);

    set((i) => {
      if (currentCardIndex !== i) return;
      return {
        x: (200 + window.innerWidth) * dir,
        y: 0,
        rot: dir * 30, // Classic Tinder rotation
        rotZ: 0,
        scale: 1,
        opacity: 0,
        config: { friction: 50, tension: 200 }
      };
    });

    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % (activeMarketIds ? activeMarketIds.length : 0));
      setIsAnimating(false);
    }, 300);
  };

  const bind = useDrag(({
    args: [index],
    down,
    movement: [mx, my],
    direction: [xDir],
    cancel,
    velocity
  }) => {
    if (isAnimating || index !== currentIndex) return;

    const trigger = Math.abs(mx) > window.innerWidth / 3;
    const vx = velocity?.[0] || 0;
    const velocityThreshold = Math.abs(vx) > 0.5;

    // Determine swipe direction and handle completion
    if (!down && (trigger || velocityThreshold)) {
      const dir = mx > 0 ? 'right' : 'left';
      handleSwipe(dir);
      return;
    }

    // If drag is released but not triggered, snap back to original position
    if (!down && !trigger && !velocityThreshold) {
      set((i) => {
        if (index !== i) return { ...to(i) };
        return {
          x: 0,
          y: 0,
          rot: 0,
          rotZ: 0,
          scale: 1,
          opacity: 1,
          config: {
            tension: 300,
            friction: 30
          }
        };
      });
      return;
    }

    set((i) => {
      if (index !== i) {
        // Simple background card animation - just scale up slightly
        if (i === currentIndex + 1) {
          return {
            ...to(i),
            scale: 0.95 + Math.abs(mx) * 0.00008
          };
        }
        return { ...to(i) };
      }

      // Classic Tinder tilt physics - simple and clean
      const rotation = mx * 0.15; // Clean rotation based on horizontal movement (increased for more visible tilt)
      const scale = down ? 0.95 : 1; // Slight scale down when dragging

      return {
        x: mx,
        y: my * 0.5, // Reduced vertical movement
        rot: rotation, // Main rotation for tilt effect
        rotZ: rotation, // Also set rotZ for consistency
        scale: scale,
        opacity: 1, // Keep full opacity
        delay: 0,
        config: {
          tension: down ? 200 : 170,
          friction: down ? 30 : 26
        }
      };
    });

    if ((trigger || velocityThreshold) && !down) cancel();
  });

  const like = () => handleSwipe('right');
  const dislike = () => handleSwipe('left');

  const visibleProps = props.slice(currentIndex);

  return (
    <div className="swipe">
      <Header />
      <div className="swipe-content">
        <div ref={cardRef} className="card-stack">
          {visibleProps.map(({ x, y, rot, rotZ, scale, opacity }, i) => {
            const actualIndex = currentIndex + i;
            if (gone.has(actualIndex) || actualIndex >= (activeMarketIds ? activeMarketIds.length : 0)) return null;

            // Simple stacking - only show top 3 cards max
            if (i > 2) return null;

            // Clean stacking with minimal offset
            const stackOffset = i * 4; // Subtle vertical offset
            const stackScale = 1 - (i * 0.02); // Minimal scale reduction

            return (
              <animated.div
                key={activeMarketIds[actualIndex]} // Use marketId as key
                style={{
                  position: 'absolute',
                  zIndex: (activeMarketIds ? activeMarketIds.length : 0) - actualIndex,
                  transform: i === 0 ? 'none' : `translateY(${stackOffset}px) scale(${stackScale})`,
                  opacity: i === 0 ? opacity : 0.8 - (i * 0.2),
                  width: '100%',
                  height: '100%'
                }}
              >
                <animated.div
                  {...(i === 0 ? bind(actualIndex) : {})}
                  style={{
                    x: i === 0 ? x : 0,
                    y: i === 0 ? y : 0,
                    rotate: i === 0 ? rot : 0,
                    scale: i === 0 ? scale : 1,
                    cursor: i === 0 ? 'grab' : 'default',
                    touchAction: 'none',
                    userSelect: 'none',
                    willChange: 'transform',
                    boxShadow: i === 0 ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                  onMouseDown={(e) => i === 0 && e.preventDefault()}
                >
                  {activeMarketIds && ( // Conditionally render MarketDetailsFetcher
                          <MarketDetailsFetcher key={activeMarketIds[actualIndex]} questionId={activeMarketIds[actualIndex]} />
                  )}

                </animated.div>
              </animated.div>
            );
          })}
        </div>

        {currentIndex < (activeMarketIds ? activeMarketIds.length : 0) && (
          <>
            <div className="stake-controls">
              <div className="stake-display">
                <span className="stake-label">Buy Amount</span>
                <span className="stake-value">{stakeAmount.toFixed(2)} PYUSD</span>
              </div>
              <div className="stake-slider-container">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                  className="stake-slider"
                  disabled={isAnimating || isWriteLoading} // Disable slider during transaction
                />
                <div className="stake-range-labels">
                  <span>0.1 PYUSD</span>
                  <span>10 PYUSD</span>
                </div>
              </div>
            </div>

            <div className="swipe-actions">
              {needsApproval ? (
                <button
                  className="swipe-button approve"
                  onClick={handleApprove}
                  disabled={isApproving || isAnimating || isWriteLoading}
                  title="Approve PYUSD spending"
                >
                  {isApproving ? 'Approving...' : 'Approve PYUSD'}
                </button>
              ) : (
                <>
                  <button
                    className="swipe-button dislike"
                    onClick={dislike}
                    disabled={isAnimating || isWriteLoading} // Disable button during transaction
                    title="Bet NO on this prediction"
                  >
                    <div className="button-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="button-label">No</span>
                  </button>

                  <button
                    className="swipe-button like"
                    onClick={like}
                    disabled={isAnimating || isWriteLoading} // Disable button during transaction
                    title="Bet YES on this prediction"
                  >
                    <div className="button-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="button-label">Yes</span>
                  </button>
                </>
              )}
            </div>
            {isWriteLoading && <p>Confirming transaction in wallet...</p>}
            {writeError && <p style={{ color: 'red' }}>Transaction failed: {writeError.message}</p>}
            {writeData && <p>Transaction successful! Hash: {writeData.hash}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default Swipe;