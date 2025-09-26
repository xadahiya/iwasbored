import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import Header from '../components/Header';
import PredictionCard from '../components/PredictionCard';
import { useSprings, animated } from 'react-spring';
import { useDrag, useGesture } from 'react-use-gesture';
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

const to = (i) => ({ x: 0, y: 0, scale: 1, rot: 0, delay: i * 100 });
const from = (i) => ({ x: 0, rot: 0, scale: 1, y: 0 });
const trans = (r, s) => `perspective(1500px) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`;

const Swipe = () => {
  const { address } = useWallet();
  const navigate = useNavigate();
  const [gone] = useState(() => new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [props, set] = useSprings(predictions.length, (i) => ({ ...to(i), from: from(i) }));
  const cardRef = useRef(null);

  useEffect(() => {
    if (!address) {
      navigate('/');
    }
  }, [address, navigate]);

  const handleSwipe = (direction) => {
    const currentCardIndex = currentIndex;
    if (currentCardIndex >= predictions.length) return;

    setIsAnimating(true);
    const dir = direction === 'right' ? 1 : -1;
    gone.add(currentCardIndex);
    
    set((i) => {
      if (currentCardIndex !== i) return;
      return {
        x: (200 + window.innerWidth) * dir,
        rot: dir * 30,
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

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity, distance, cancel }) => {
    if (isAnimating) return;
    
    const trigger = velocity > 0.2 || distance > threshold;
    const dir = trigger ? (xDir > 0 ? 1 : -1) : 0;
    
    if (down && Math.abs(mx) > 200) {
      setIsAnimating(true);
      gone.add(index);
      cancel();
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
    
    if (!down && trigger) {
      setIsAnimating(true);
      gone.add(index);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
    
    set((i) => {
      if (index !== i) return;
      const isGone = gone.has(index);
      const x = down ? mx : isGone ? (200 + window.innerWidth) * dir : 0;
      const rot = down ? mx / 10 : isGone ? dir * 30 : 0;
      const scale = down ? 1 - Math.abs(mx) / 1000 : 1;
      const opacity = down ? 1 - Math.abs(mx) / 300 : isGone ? 0 : 1;
      
      return {
        x,
        rot,
        scale,
        opacity,
        delay: down ? 0 : 300,
        config: { friction: 50, tension: down ? 800 : 200 }
      };
    });
  });

  const bindCursor = useGesture({
    onDrag: ({ active, movement: [mx], direction: [xDir], event }) => {
      if (isAnimating || !cardRef.current) return;
      
      event.preventDefault();
      const cardElement = cardRef.current.querySelector('.prediction-card');
      if (!cardElement) return;
      
      if (active) {
        const dir = xDir > 0 ? 1 : -1;
        const opacity = 1 - Math.abs(mx) / 300;
        const rot = mx / 10;
        const scale = 1 - Math.abs(mx) / 1000;
        
        cardElement.style.transform = `translate3d(${mx}px, 0, 0) rotate(${rot}deg) scale(${scale})`;
        cardElement.style.opacity = opacity;
      } else {
        const dragDistance = Math.abs(mx);
        const trigger = dragDistance > 200;
        
        if (trigger) {
          const direction = xDir > 0 ? 'right' : 'left';
          handleSwipe(direction);
        } else {
          cardElement.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
          cardElement.style.opacity = 1;
        }
      }
    },
    onDragEnd: ({ movement: [mx], direction: [xDir] }) => {
      if (isAnimating || !cardRef.current) return;
      
      const dragDistance = Math.abs(mx);
      if (dragDistance > 200) {
        const direction = xDir > 0 ? 'right' : 'left';
        handleSwipe(direction);
      }
    }
  }, { 
    transform: ([x, y]) => [x, y, 0],
    rubberband: true
  });

  const threshold = 50;
  const like = () => handleSwipe('right');
  const dislike = () => handleSwipe('left');

  const visiblePredictions = predictions.slice(currentIndex);
  const visibleProps = props.slice(currentIndex);

  return (
    <div className="swipe">
      <Header />
      <div className="swipe-content">
        <div ref={cardRef} className="card-stack">
          {visibleProps.map(({ x, y, rot, scale, opacity }, i) => {
            const actualIndex = currentIndex + i;
            if (gone.has(actualIndex)) return null;
            
            return (
              <animated.div 
                key={predictions[actualIndex].id} 
                style={{ 
                  transform: `translate3d(${x}px,${y}px,0)`,
                  position: 'absolute',
                  zIndex: predictions.length - actualIndex,
                  opacity: opacity
                }}
              >
                <animated.div {...bind(actualIndex)} style={{ transform: trans(rot, scale) }}>
                  <PredictionCard prediction={predictions[actualIndex]} />
                </animated.div>
              </animated.div>
            );
          })}
        </div>
        
        {currentIndex < predictions.length && (
          <div className="swipe-actions">
            <button 
              className="swipe-button dislike" 
              onClick={dislike}
              onMouseDown={(e) => {
                const cardElement = cardRef.current?.querySelector('.prediction-card');
                if (cardElement) {
                  cardElement.style.cursor = 'grabbing';
                }
              }}
              onMouseUp={(e) => {
                const cardElement = cardRef.current?.querySelector('.prediction-card');
                if (cardElement) {
                  cardElement.style.cursor = 'grab';
                }
              }}
            >
              <span>❌</span>
            </button>
            <button 
              className="swipe-button like" 
              onClick={like}
              onMouseDown={(e) => {
                const cardElement = cardRef.current?.querySelector('.prediction-card');
                if (cardElement) {
                  cardElement.style.cursor = 'grabbing';
                }
              }}
              onMouseUp={(e) => {
                const cardElement = cardRef.current?.querySelector('.prediction-card');
                if (cardElement) {
                  cardElement.style.cursor = 'grab';
                }
              }}
            >
              <span>✅</span>
            </button>
          </div>
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
