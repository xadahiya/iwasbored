import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, ReferenceDot, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchPythPriceData } from '../utils/pyth';
import './PredictionCard.css';

const PredictionCard = ({ prediction }) => {
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getPriceData = async () => {
      if (!prediction.priceFeedId) {
        setError(new Error('priceFeedId is missing for this prediction.'));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPythPriceData(
          prediction.priceFeedId,
          prediction.marketStartTimestamp,
          prediction.marketEndTimestamp
        );
        setPriceData(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    getPriceData();

    const interval = setInterval(getPriceData, 60 * 1000);
    return () => clearInterval(interval);
  }, [prediction.priceFeedId, prediction.marketStartTimestamp, prediction.marketEndTimestamp]);

  const currentPrice = priceData?.currentPrice || 0;
  const priceChange = priceData?.priceChange || 0;
  const historicalData = priceData?.historicalData || [];

  console.log('PredictionCard - prediction:', prediction);
  console.log('PredictionCard - priceData:', priceData);
  console.log('PredictionCard - isLoading:', isLoading);
  console.log('PredictionCard - error:', error);
  console.log('PredictionCard - historicalData.length:', historicalData.length);

  const marketStartPoint = historicalData.find(point => point.isMarketStart);
  const marketEndPoint = historicalData.find(point => point.isMarketEnd);

  // Custom Tooltip for recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="intro">{`Price: $${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

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
          {isLoading && <span className="current-price">Loading...</span>}
          {error && <span className="current-price" style={{ color: 'red' }}>Error</span>}
          {priceData && (
            <>
              <span className="current-price">${currentPrice.toLocaleString()}</span>
              <span className="price-change" style={{ color: priceChange >= 0 ? 'green' : 'red' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange}%
              </span>
            </>
          )}
        </div>
        <div className="chart-container">
          {isLoading && <p>Loading chart data...</p>}
          {error && <p style={{ color: 'red' }}>Could not load chart.</p>}
          {priceData && historicalData.length > 0 && prediction.status == undefined && (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={historicalData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="price" stroke={prediction.color} strokeWidth={3} dot={false} />

                {marketStartPoint && (
                  <ReferenceDot
                    x={marketStartPoint.name}
                    y={marketStartPoint.price}
                    r={5}
                    fill="green"
                    stroke="white"
                    key="marketStart"
                  />
                )}
                {marketEndPoint && (
                  <ReferenceDot
                    x={marketEndPoint.name}
                    y={marketEndPoint.price}
                    r={5}
                    fill="red"
                    stroke="white"
                    key="marketEnd"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="prediction-section">
          <div className="prediction-question">
            {prediction.question}
          </div>
        </div>
        {prediction.probability !== undefined && prediction.probability !== null && (
        <div className="probability-section" style={{ marginTop: 12, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 24 }}>
          {/* YES Probability */}
          <div style={{ display: 'inline-block', textAlign: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#888' }}>
              Yes:&nbsp;
              <span style={{ color: '#27ae60', fontWeight: 700 }}>
                {Array.isArray(prediction.probability)
                  ? (Number(prediction.probability[0]) / 1e7).toFixed(1) + '%'
                  : (Number(prediction.probability) / 1e7).toFixed(1) + '%'
                }
              </span>
            </span>
          </div>
          {/* NO Probability */}
          <div style={{ display: 'inline-block', textAlign: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#888' }}>
              No:&nbsp;
              <span style={{ color: '#e74c3c', fontWeight: 700 }}>
                {Array.isArray(prediction.probability)
                  ? (
                      prediction.probability.length > 1
                        ? (Number(prediction.probability[1]) / 1e7).toFixed(1) + '%'
                        : (100 - (Number(prediction.probability[0]) / 1e7)).toFixed(1) + '%'
                    )
                  : (100 - (Number(prediction.probability) / 1e7)).toFixed(1) + '%'
                }
              </span>
            </span>
          </div>
        </div>
      )}
      </div>
      
      
  );
};

export default PredictionCard;