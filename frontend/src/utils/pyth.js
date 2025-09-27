// src/utils/pyth.js

const PYTH_API_BASE_URL = 'https://hermes.pyth.network/api'; // Hermes API base URL

export const fetchPythPriceData = async (priceFeedId, marketStartTimestamp, marketEndTimestamp, durationMinutes = 120) => {
  console.log(`Fetching latest Pyth price for priceFeedId: ${priceFeedId} and simulating historical data for last ${durationMinutes} minutes.`);

  try {
    // 1. Fetch the latest price from Hermes API
    const response = await fetch(`${PYTH_API_BASE_URL}/latest_price_feeds?ids[]=${priceFeedId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    let currentPrice = 0;
    let latestPriceTimestamp = Date.now(); // Default to now if not available

    if (data && data.length > 0 && data[0].price) {
      const priceInfo = data[0].price;
      currentPrice = parseFloat(priceInfo.price) * Math.pow(10, priceInfo.expo);
      latestPriceTimestamp = priceInfo.publish_time * 1000; // Convert to milliseconds
    } else {
      throw new Error('Invalid latest price data structure from Pyth API.');
    }

    // 2. Simulate historical data based on the latest price
    const historicalData = [];
    const now = Date.now();
    const priceRange = currentPrice * 0.05; // Simulate 5% fluctuation around current price

    const numberOfDataPoints = 30; // Target around 30 data points
    const intervalMinutes = durationMinutes / numberOfDataPoints; // Interval between data points

    for (let i = numberOfDataPoints; i >= 0; i--) {
      const time = new Date(now - i * intervalMinutes * 60 * 1000); // Calculate time based on interval
      // Generate price fluctuating around the current price
      const simulatedPrice = currentPrice + (Math.random() * priceRange * 2) - priceRange;
      historicalData.push({
        name: time.toLocaleTimeString(), // Use formatted time for display
        price: parseFloat(simulatedPrice.toFixed(2)),
        timestamp: time.getTime(),
      });
    }

    // Ensure the last data point is the actual current price from the API
    if (historicalData.length > 0) {
      historicalData[historicalData.length - 1].price = parseFloat(currentPrice.toFixed(2));
      historicalData[historicalData.length - 1].timestamp = latestPriceTimestamp;
      historicalData[historicalData.length - 1].name = new Date(latestPriceTimestamp).toLocaleTimeString();
    }

    // Simulate current price and change based on the generated historical data
    const simulatedCurrentPrice = historicalData[historicalData.length - 1].price;
    const simulatedPreviousPrice = historicalData[0].price;
    const priceChange = simulatedPreviousPrice !== 0 ? ((simulatedCurrentPrice - simulatedPreviousPrice) / simulatedPreviousPrice) * 100 : 0;


    // Add market start and end points to the data if they fall within the chart's time range
    const chartStartTime = now - durationMinutes * 60 * 1000;

    if (marketStartTimestamp && marketStartTimestamp * 1000 >= chartStartTime && marketStartTimestamp * 1000 <= now) {
      const startTime = marketStartTimestamp * 1000;
      const closestStartPoint = historicalData.reduce((prev, curr) => (
        Math.abs(curr.timestamp - startTime) < Math.abs(prev.timestamp - startTime) ? curr : prev
      ));
      closestStartPoint.isMarketStart = true;
    }

    if (marketEndTimestamp && marketEndTimestamp * 1000 >= chartStartTime && marketEndTimestamp * 1000 <= now) {
      const endTime = marketEndTimestamp * 1000;
      const closestEndPoint = historicalData.reduce((prev, curr) => (
        Math.abs(curr.timestamp - endTime) < Math.abs(prev.timestamp - endTime) ? curr : prev
      ));
      closestEndPoint.isMarketEnd = true;
    }

    return {
      historicalData: historicalData,
      currentPrice: parseFloat(simulatedCurrentPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching Pyth price data:', error);
    throw error;
  }
};