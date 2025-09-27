# IWasBored - Crypto Betting Platform with Age Verification

A decentralized betting platform that allows users to swipe and predict cryptocurrency price movements. Features robust age verification using Self Protocol to ensure users are 18+ years old.

## 🚀 Features

- **Age Verification**: Users must verify they are 18+ using Self Protocol's government ID verification
- **Crypto Betting**: Swipe-based interface for predicting cryptocurrency price movements  
- **Wallet Integration**: Connect with MetaMask and other Web3 wallets
- **Real-time Predictions**: Bet on various cryptocurrencies, stocks, commodities, and forex
- **Secure & Private**: Zero-knowledge proof verification protects user privacy

## 🏗️ Architecture

```
iwasbored/
├── frontend/          # React.js web application
├── contracts/         # Smart contracts (Hardhat + Self Protocol)
└── tmp/workshop/      # Reference Self Protocol implementation
```

## 📋 Prerequisites

- Node.js 18+ or 22.10+ (for Hardhat compatibility)
- MetaMask or compatible Web3 wallet
- [Self Protocol Mobile App](https://self.xyz/download)

## 🛠️ Setup

### 1. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

### 2. Smart Contracts Setup

```bash
cd contracts
npm install
npm run compile
npm run test
```

To deploy locally:
```bash
# Start local blockchain
npm run node

# Deploy contracts (in another terminal)
npm run deploy:hardhat
```

### 3. Environment Configuration

Copy `frontend/env.example` to `frontend/.env` and update with your contract addresses:

```env
REACT_APP_AGE_VERIFICATION_CONTRACT=0xYourContractAddress
REACT_APP_SELF_ENDPOINT=0xYourContractAddress
REACT_APP_SELF_APP_NAME="IWasBored Age Verification"
REACT_APP_SELF_SCOPE="iwasbored"
```

## 🔐 Age Verification Flow

1. **Connect Wallet**: Users connect their Web3 wallet
2. **Age Verification**: Redirected to verification page if not verified
3. **QR Code Generation**: Self Protocol generates unique QR code
4. **Mobile Verification**: Users scan QR with Self Protocol app
5. **ID Verification**: Government-issued ID is verified using zero-knowledge proofs
6. **Access Granted**: Users can access betting features once verified as 18+

## 🎯 User Journey

```
Onboarding → Age Verification → Swipe Interface → My Bets
```

- **Onboarding**: Wallet connection and initial setup
- **Age Verification**: Self Protocol ID verification (one-time)
- **Swipe Interface**: Tinder-like betting on price predictions
- **My Bets**: View active and resolved bets

## 🔧 Technology Stack

### Frontend
- **React 19**: User interface framework
- **React Router**: Navigation and routing
- **React Spring**: Smooth animations for swipe interface
- **Self Protocol SDK**: Age verification integration
- **Ethers.js**: Blockchain interactions

### Smart Contracts
- **Solidity 0.8.28**: Smart contract language
- **Hardhat**: Development and testing framework
- **Self Protocol**: Identity verification infrastructure
- **OpenZeppelin**: Security-audited contract utilities

### Blockchain
- **Celo**: Layer-1 blockchain for deployment
- **Self Protocol Hub**: Identity verification on Celo

## 🌐 Networks

### Testnet (Celo Sepolia)
- **RPC**: `https://forno.celo-sepolia.celo-testnet.org`
- **Explorer**: `https://celo-sepolia.blockscout.com/`
- **Self Hub**: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`

### Mainnet (Celo)
- **RPC**: `https://forno.celo.org`
- **Explorer**: `https://celoscan.io`
- **Self Hub**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`

## 🔒 Security & Privacy

- **Age Compliance**: Mandatory 18+ verification before platform access
- **Zero-Knowledge Proofs**: Personal data verified but not stored
- **Smart Contract Security**: Built on audited OpenZeppelin standards
- **Private Key Security**: Users maintain custody of their wallets

## 📱 Self Protocol Integration

The platform uses Self Protocol for secure, privacy-preserving age verification:

1. **Government ID Verification**: Real passport/ID validation
2. **Zero-Knowledge Proofs**: Proves age without revealing personal data
3. **One-Time Verification**: Users verify once per wallet address
4. **Cross-Platform**: Works on iOS and Android via Self Protocol app

## 🚀 Deployment

### Local Development
```bash
# Frontend
cd frontend && npm start

# Contracts
cd contracts && npm run node
cd contracts && npm run deploy:hardhat
```

### Production Deployment
1. Deploy contracts to Celo mainnet
2. Update frontend environment variables
3. Deploy frontend to hosting platform
4. Configure domain and SSL

## 📖 Documentation

- **Contracts**: See `contracts/README.md` for smart contract details
- **Self Protocol**: [Official Documentation](https://docs.self.xyz/)
- **Celo**: [Developer Documentation](https://docs.celo.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## ⚖️ Legal Compliance

This platform implements age verification to comply with legal requirements for gambling and betting platforms. Users must be 18+ years old and verification is mandatory before accessing betting features.

## 🔗 Links

- [Self Protocol](https://self.xyz/)
- [Celo Blockchain](https://celo.org/)
- [Hardhat Framework](https://hardhat.org/)
- [React Documentation](https://react.dev/)

## 📄 License

MIT License - see LICENSE file for details.
