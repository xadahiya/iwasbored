import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import Header from '../components/Header';
import PredictionCard from '../components/PredictionCard';
import { useSprings, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import './Swipe.css';

const predictions = [
  { 
    id: 1, 
    question: 'ETH above $2,500 in 5 mins?', 
    stake: 0.10,
    title: 'Ethereum',
    description: 'Will ETH reach $2,500 within the next 5 minutes?',
    icon: '◈',
    color: '#627eea',
    type: 'crypto'
  },
  { 
    id: 2, 
    question: 'BTC above $30,000 in 10 mins?', 
    stake: 0.15,
    title: 'Bitcoin',
    description: 'Will BTC break the $30,000 barrier?',
    icon: '₿',
    color: '#f7931a',
    type: 'crypto'
  },
  { 
    id: 3, 
    question: 'DOGE above $0.15 in 2 mins?', 
    stake: 0.08,
    title: 'Dogecoin',
    description: 'Meme coin madness continues?',
    icon: 'Ð',
    color: '#c3a637',
    type: 'crypto'
  },
  { 
    id: 4, 
    question: 'SOL above $180 in 8 mins?', 
    stake: 0.12,
    title: 'Solana',
    description: 'Will SOL continue its bull run?',
    icon: '◎',
    color: '#00D4AA',
    type: 'crypto'
  },
  { 
    id: 5, 
    question: 'Will AAPL hit $200 by EOD?', 
    stake: 0.18,
    title: 'Apple Inc.',
    description: 'Tech giant continues upward trend?',
    icon: '🍎',
    color: '#000000',
    type: 'stock'
  },
  { 
    id: 6, 
    question: 'TSLA above $250 in 15 mins?', 
    stake: 0.14,
    title: 'Tesla',
    description: 'Electric vehicle surge continues?',
    icon: '🚗',
    color: '#CC0000',
    type: 'stock'
  },
  { 
    id: 7, 
    question: 'NFLX above $450 in 20 mins?', 
    stake: 0.16,
    title: 'Netflix',
    description: 'Streaming giant keeps climbing?',
    icon: '📺',
    color: '#E50914',
    type: 'stock'
  },
  { 
    id: 8, 
    question: 'Gold above $2,000/oz in 30 mins?', 
    stake: 0.20,
    title: 'Gold',
    description: 'Safe haven demand surges?',
    icon: '🏆',
    color: '#FFD700',
    type: 'commodity'
  },
  { 
    id: 9, 
    question: 'Oil above $85/barrel in 45 mins?', 
    stake: 0.22,
    title: 'Crude Oil',
    description: 'Energy prices keep rising?',
    icon: '⛽',
    color: '#8B4513',
    type: 'commodity'
  },
  { 
    id: 10, 
    question: 'EUR/USD above 1.10 in 10 mins?', 
    stake: 0.11,
    title: 'EUR/USD',
    description: 'Euro strengthens against dollar?',
    icon: '💶',
    color: '#0080FF',
    type: 'forex'
  },
  { 
    id: 11, 
    question: 'BTC dominance above 50%?', 
    stake: 0.13,
    title: 'BTC Dominance',
    description: 'Bitcoin market share growing?',
    icon: '🪙',
    color: '#FFA500',
    type: 'metric'
  },
  { 
    id: 12, 
    question: 'DeFi TVL above $80B?', 
    stake: 0.17,
    title: 'DeFi Total Value',
    description: 'DeFi ecosystem continues expanding?',
    icon: '📊',
    color: '#00CED1',
    type: 'defi'
  },
];

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

// Clean Tinder-style transform function (unused but kept for reference)
// const trans = (x, y, rot, rotZ, scale) => 
//   `translate3d(${x}px, ${y}px, 0) rotateZ(${rot}deg) scale(${scale})`;

const Swipe = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [gone] = useState(() => new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(0.10);
  const [props, set] = useSprings(predictions.length, (i) => ({ ...to(i), from: from(i) }));
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

  const handleSwipe = (direction) => {
    const currentCardIndex = currentIndex;
    if (currentCardIndex >= predictions.length || isAnimating) return;

    // Log the bet placement (in a real app, this would be sent to backend)
    const prediction = predictions[currentCardIndex];
    const betType = direction === 'right' ? 'YES' : 'NO';
    console.log(`Placing bet: ${betType} on "${prediction.question}" with stake: ${stakeAmount} ETH`);

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
      setCurrentIndex(prev => prev + 1);
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
            if (gone.has(actualIndex) || actualIndex >= predictions.length) return null;
            
            // Simple stacking - only show top 3 cards max
            if (i > 2) return null;
            
            // Clean stacking with minimal offset
            const stackOffset = i * 4; // Subtle vertical offset
            const stackScale = 1 - (i * 0.02); // Minimal scale reduction
            
            return (
              <animated.div 
                key={predictions[actualIndex].id} 
                style={{ 
                  position: 'absolute',
                  zIndex: predictions.length - actualIndex,
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
                  <PredictionCard prediction={predictions[actualIndex]} />
                </animated.div>
              </animated.div>
            );
          })}
        </div>
        
        {currentIndex < predictions.length && (
          <>
            <div className="stake-controls">
              <div className="stake-display">
                <span className="stake-label">Stake Amount</span>
                <span className="stake-value">{stakeAmount.toFixed(2)} ETH</span>
              </div>
              <div className="stake-slider-container">
                <input
                  type="range"
                  min="0.01"
                  max="1.00"
                  step="0.01"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                  className="stake-slider"
                  disabled={isAnimating}
                />
                <div className="stake-range-labels">
                  <span>0.01 ETH</span>
                  <span>1.00 ETH</span>
                </div>
              </div>
            </div>
            
            <div className="swipe-actions">
              <button 
                className="swipe-button dislike" 
                onClick={dislike}
                disabled={isAnimating}
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
                disabled={isAnimating}
                title="Bet YES on this prediction"
              >
                <div className="button-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="button-label">Yes</span>
              </button>
            </div>
          </>
        )}
        
        {currentIndex >= predictions.length && (
          <div className="swipe-complete">
            <h2>All predictions swiped!</h2>
            <p>Check out your My Bets to see your active predictions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swipe;

