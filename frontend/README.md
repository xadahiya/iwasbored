# I Was Bored - Prediction Markets Frontend

A swipe-based prediction market app where users can bet on cryptocurrency price movements. Built with React, TypeScript, and Web3 integration.

## 🎯 Overview

I Was Bored is a gamified prediction market platform that allows users to:

- **Swipe to Bet**: Intuitive Tinder-style interface for making predictions
- **Crypto Prediction Markets**: Bet on whether cryptocurrencies will go up or down
- **Real-time Oracle Data**: Integrated with Pyth Network for accurate price feeds
- **Smart Contract Integration**: Built on blockchain technology with secure transactions
- **User Portfolio Tracking**: Monitor bets, earnings, and redemption status

## 🏗️ Tech Stack

### Core Technologies
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **CRACO** - Create React App Configuration Override for custom webpack config

### Web3 Integration
- **Wagmi** - React hooks for Ethereum interaction
- **Viem** - TypeScript interface for Ethereum
- **Ethers.js** - Ethereum wallet interaction
- **Web3Modal** - Wallet connection interface
- **ConnectKit** - Web3 connection UI

### UI & Animation
- **Framer Motion** - Animation library
- **React Spring** - Physics-based animations
- **React Use Gesture** - Gesture handling for swipe interactions

### Data & Charts
- **TanStack Query** - Server state management
- **Recharts** - Data visualization charts
- **React Icons** - Icon library

### Other Libraries
- **React Router DOM** - Navigation
- **QRCode** - QR code generation
- **@selfxyz/common** - Common utilities

## 🚀 Features

### Core Pages
- **Onboarding**: Initial setup and wallet connection
- **Age Verification**: Compliance verification flow
- **Swipe**: Main betting interface with card-based predictions
- **My Bets**: User's betting history and portfolio
- **Leaderboard**: Competitive rankings

### Key Functionality
- **Smart Contract Integration**: Oracle contract at `0x29471e7732F79E9A5f9e1ca09Cc653f53928742F`
- **PYUSD Token Support**: US Dollar coin for betting
- **Chain Detection**: Automatic network switching to Sepolia
- **Real-time Data**: Pyth Network price feeds for ETH, BTC, USDC, SOL
- **Portfolio Management**: Track spending, earnings, and positions

## 📱 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or Web3 wallet
- Sepolia network access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Add your environment variables
   ```

4. **Run the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to [http://localhost:3003](http://localhost:3003)

## 🛠️ Development Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server on port 3003 |
| `npm run build` | Build for production |
| `npm test` | Run tests in watch mode |
| `npm run eject` | Eject from Create React App |

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BetCard.js
│   ├── PredictionCard.js
│   ├── Header.js
│   └── ...
├── pages/              # Page components
│   ├── Swipe.js
│   ├── MyBets.js
│   ├── Leaderboard.js
│   └── ...
├── utils/              # Utility functions and contracts
│   ├── OracleContract.js
│   ├── pyth.js
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useENS.js
│   └── ...
├── contexts/           # React contexts
│   └── WalletContext.js
└── wagmiConfig.js      # Web3 configuration
```

## 🔗 Smart Contracts

### Oracle Contract
- **Address**: `0x29471e7732F79E9A5f9e1ca09Cc653f53928742F`
- **Functions**: Market creation, position buying, redemption
- **Chain**: Sepolia Testnet

### Supported Tokens
- **PYUSD**: Primary betting token
- **Price Feeds**: ETH, BTC, USDC, SOL via Pyth Network

## 🎨 User Flow

1. **Onboarding**: Connect wallet and verify age
2. **Navigation**: Access prediction markets
3. **Betting**: Swipe left (No) or right (Yes) on predictions
4. **Portfolio**: Track positions and earnings
5. **Redemption**: Claim winnings after market resolution

## 🚀 Deployment

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `build/`
- Environment variables configured for production

### Production Build
```bash
npm run build
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` file:
```env
REACT_APP_NETWORK_ID=11155111  # Sepolia chain ID
REACT_APP_ORACLE_ADDRESS=0x29471e7732F79E9A5f9e1ca09Cc653f53928742F
```

### Custom Configuration
- Custom webpack config via CRACO
- Custom port configuration (3003)
- ESLint rules updated

## 📊 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.