# I Was Bored - A Gamified Prediction Market

**Submission for ETH India.**

**I Was Bored** is a decentralized, gamified prediction market platform with a strong emphasis on compliance and user experience. Users can bet on the future price of crypto assets using PayPal's PYUSD stablecoin in a fun, Tinder-like swiping interface, while their privacy is protected through Zero-Knowledge age verification.

---

## 🚀 Live Demo & Links

*   **Live Frontend:** [https://gleeful-semolina-46d5ac.netlify.app/]
*   **Deployed Contracts:**
    *   **Prediction Market (Sepolia):** `0xEfeFbB5e484b384A6a31f07F862bDA4D21267De3`
    *   **Age Verification (Celo):** `0x5e5b05e86b98ea1133cadde46b67dcbbb9f13dee`

---

## 🎯 The Problem

Prediction markets are a powerful tool for forecasting, but they suffer from several key problems that limit their adoption:
1.  **Poor User Experience:** Most platforms are built for professional traders, with complex interfaces that are intimidating for new users.
2.  **Regulatory Hurdles:** The sensitive nature of betting and financial speculation requires strong compliance, such as age verification and jurisdictional restrictions, which are often difficult to implement in a decentralized and privacy-preserving way.
3.  **Centralization Risks:** Many "decentralized" applications still rely on centralized servers for backend logic, creating single points of failure and censorship.

## ✨ My Solution: "I Was Bored"

I solve these problems by combining cutting-edge Web3 protocols into a seamless and engaging platform:

*   **Fully On-Chain Core Logic:** The entire lifecycle of a prediction market is handled by smart contracts, built on the battle-tested **Gnosis Conditional Tokens Framework**.
*   **Gamified UX:** A "Swipe-to-Bet" interface makes participation intuitive and fun.
*   **Automated Liquidity:** I use a **Fixed Product Market Maker (FPMM)** to provide automated liquidity for every market, ensuring users can always trade.
*   **ZK-Powered Compliance:** I use **Self.xyz** to verify users are over 18 and are not residents of the United States, without ever accessing their personal data.
*   **High-Fidelity Oracles:** **Pyth Network** provides real-time, reliable price feeds to ensure fair market creation and resolution.
*   **Decentralized Automation:** All backend logic and automation scripts are hosted on the **Fluence** network, making my platform truly serverless and censorship-resistant.
*   **Stable Collateral:** I use **PYUSD** on the Sepolia testnet, providing a stable unit of account for betting.
*   **Human-Readable Names:** **ENS** integration allows for a more user-friendly experience.


---

## 🌊 System Architecture & Flow

My architecture is a multi-chain system that leverages the strengths of different protocols and networks.

### High-Level Architecture

```
+---------------------------------------------------------------------------------+
|                                  User Interface                                 |
|                               (React Frontend)                                  |
+---------------------------------------------------------------------------------+
      |                 |                  |                   |                |
      | (Wagmi/Viem)    | (Self.xyz SDK)   | (Pyth API)        | (ENS)          | (Fluence JS Client)
      |                 |                  |                   |                |
+-----v-----------------+------------------v-------------------v----------------v------+
| Sepolia Testnet       | Celo Network     | Pyth Network      | ENS Registry   | Fluence Network     |
|-----------------------|------------------|-------------------|----------------|---------------------|
| - Gnosis Conditional  | - Age            | - Real-time       | - Name         | - Backend Server    |
|   Tokens & FPMM       |   Verification   |   Price Feeds     |   Resolution   | - Market Automation |
| - ERC20 (PYUSD)       |   Contract       |                   |                |   Scripts           |
+-----------------------+------------------+-------------------+----------------+---------------------+
```

### User Onboarding & Betting Flow

This diagram illustrates the user's journey from first connecting their wallet to placing a bet.

```
START
  |
  v
[Connect Wallet]
  |
  v
[Check Age Verification Status (on Celo)] -- NO --> [Redirect to Age Verification Page]
  |                                                     |
 YES                                                    v
  |                                                 [Generate QR Code (Self.xyz)]
  |                                                     |
  v                                                     v
[Access Swipe Interface] <--- YES --- [Scan with Self App & Submit ZK Proof]
  |
  v
[Fetch Market from Backend (Fluence)]
  |
  v
[Display Prediction Card with Pyth Chart]
  |
  v
[User Swipes Right ("YES") or Left ("NO")]
  |
  v
[Sign Transaction to trade PYUSD for outcome tokens via the FPMM contract (on Sepolia)]
  |
  v
[User receives YES/NO tokens. Bet is recorded on-chain.]
  |
  v
END
```

---

## 🔧 Technology Deep Dive: My Stack

I carefully selected each protocol to build a robust and truly decentralized application.

### **Pyth Network** - The Oracle for Real-Time Prices

*   **Why:** Prediction markets are only as fair as their data. I chose Pyth for its high-frequency updates, robust aggregation from multiple sources, and on-chain "pull" model, which is gas-efficient and provides confidence scores.
*   **Where:**
    1.  **Smart Contracts (`SimplePredictionsOracle.sol`):** The oracle contract on Sepolia calls the Pyth contract to get the initial price when a market is created and the final price when it's resolved.
    2.  **Frontend:** The React components use Pyth's API to display live-updating price charts on the prediction cards, giving users the context they need to make informed decisions.
*   **How:** My Fluence-hosted backend triggers the `createMarket` function in my smart contract. The contract then "pulls" the latest price from Pyth's on-chain contract. When the market expires, another automated script calls `resolveMarket`, which again pulls the price from Pyth to determine the winning outcome.

### **Self.xyz** - Privacy-Preserving Age Verification

*   **Why:** To operate a betting platform legally and ethically, I must enforce compliance rules such as age and jurisdictional restrictions. I use Self.xyz to verify that users are over 18 AND are not residents of the United States. This is accomplished without me ever storing or even seeing sensitive user data, thanks to Zero-Knowledge Proofs.
*   **Where:**
    1.  **Smart Contract (`AgeVerification.sol`):** Deployed on the Celo network, this contract acts as the on-chain verifier for these two facts.
    2.  **Frontend:** The onboarding flow directs unverified users to an age verification page.
*   **How:** A new user is shown a QR code. They scan this with the Self.xyz mobile app. The app verifies their government-issued ID (passport, driver's license) using the phone's secure hardware and generates a ZK proof attesting to two facts: 1) the user is over 18, and 2) their country of residence is not the USA. This proof is sent to my `AgeVerification.sol` contract, which checks it against the Self Protocol Hub on Celo. If valid, the user's wallet address is permanently marked as compliant.

### **Gnosis Conditional Tokens & FPMM** - The On-Chain Market Engine

*   **Why:** To build a truly decentralized prediction market, the core logic must be on-chain, transparent, and non-custodial. The Gnosis (now Omen) Conditional Tokens Framework is the industry standard for this. It provides an audited and highly flexible framework for creating complex prediction assets (conditional tokens). The Fixed Product Market Maker (FPMM) provides a simple and capital-efficient way to bootstrap liquidity for these assets.
*   **Where:** This framework is the heart of my smart contract architecture on Sepolia.
    1.  **`ConditionalTokens.sol`:** The core contract that allows for the creation of conditional tokens (e.g., "YES" and "NO" outcome tokens).
    2.  **`FixedProductMarketMaker.sol`:** The contract that manages the liquidity pool between the collateral (PYUSD) and the two outcome tokens for a given market.
    3.  **`Factory.sol`:** My custom factory contract that simplifies the process of creating a new market by deploying and configuring a new FPMM instance.
*   **How:** When a new market is created, my `Factory` contract defines a question and creates a corresponding `condition` in the `ConditionalTokens` contract. It then deploys an FPMM, providing it with initial liquidity (PYUSD). This FPMM holds the collateral and allows users to trade PYUSD for "YES" or "NO" tokens. The price of these tokens automatically adjusts based on the ratio of tokens in the pool, reflecting the market's collective prediction.

### **Fluence** - The Decentralized Automation Layer

*   **Why:** While my application logic is fully on-chain, I needed a reliable and decentralized way to perform automation, such as creating new markets and resolving old ones. Relying on a centralized server (like AWS) would undermine my project's decentralization. Fluence allows me to run this backend logic on a trustless, peer-to-peer network.
*   **Where:** My entire `backend` directory, including the FastAPI server and market management scripts, is deployed as a service on the Fluence network.
*   **How:**
    *   **Market Creation:** A script runs on a schedule on Fluence, calling my `Factory.sol` contract to create new prediction markets with random assets and expiry times.
    *   **Market Resolution:** Another script constantly monitors for expired markets. When a market ends, it calls the `resolveMarket` function to trigger the final price fetch from Pyth and settle the market.
    *   **API Server:** A lightweight FastAPI server runs on Fluence to provide aggregated data to my frontend, reducing the need for excessive direct blockchain calls.

### **PYUSD on Sepolia** - The Stable Collateral

*   **Why:** Betting with a volatile asset like ETH makes it hard to track wins and losses. I chose PYUSD, a reputable stablecoin, to provide a stable unit of account. Using it on the Sepolia testnet is ideal for a hackathon context.
*   **Where:** PYUSD is the core currency of the prediction market on Sepolia.
*   **How:** Users acquire test PYUSD and use it to buy "YES" or "NO" shares in a market. The platform's liquidity pools are denominated in PYUSD, and winnings are paid out in PYUSD.

### **ENS (Ethereum Name Service)** - Human-Readable Addresses

*   **Why:** Hexadecimal addresses are ugly and error-prone. ENS allows me to build a more human-centric application.
*   **Where:** The frontend UI, such as the user's profile and leaderboard.
*   **How:** My frontend uses `viem`'s built-in functionality to perform a reverse lookup for the connected wallet address. If an ENS name is found, it is displayed instead of the long address.

---

## 📂 Project Structure

The project is a monorepo containing three distinct packages:

```
/
├── backend/          # Python backend for Fluence
│   ├── create_market.py # Market creation script
│   └── market_monitor.py # Market resolution script
│
├── contracts/        # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── ConditionalTokens.sol       # Gnosis framework core
│   │   ├── FixedProductMarketMaker.sol # Gnosis framework FPMM
│   │   ├── Factory.sol                 # My custom factory for creating markets
│   │   ├── SimplePredictionsOracle.sol # Main oracle with Pyth integration
│   │   └── AgeVerification.sol       # Self.xyz integration on Celo
│   └── scripts/      # Deployment and automation scripts
│
├── frontend/         # React.js web application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Swipe.js        # The core betting interface
│   │   │   └── AgeVerification.js # Onboarding flow for Self.xyz
│   │   ├── components/     # Reusable UI components
│   │   └── wagmiConfig.js    # Wagmi and Viem setup
│
└── README.md         # This file
```

---

## 🛠️ How to Run Locally

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+) with Poetry
*   MetaMask wallet browser extension

### 1. Environment Setup
Copy all `.env.example` files in `frontend`, `backend`, and `contracts` to `.env` in their respective directories and fill in the required values (RPC URLs, private keys, etc.).

### 2. Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile

# To deploy to a testnet (e.g., Sepolia)
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### 3. Backend
The backend is designed to run on Fluence. For local testing, you can run the scripts directly.
```bash
cd backend
poetry install
poetry run python create_market.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
```
The application will be available at `http://localhost:3003`.

---

## 🚀 Future Improvements

*   **Multi-Chain Markets:** Expand beyond Sepolia to other L2s and mainnets.
*   **Advanced Markets:** Introduce scalar markets (predicting a specific price) and multi-outcome markets.
*   **Governance:** Implement a DAO to govern market creation, resolve disputes, and manage the treasury.
*   **Social Features:** Allow users to share their bets and follow top traders on the leaderboard.

---

## 🏆 The Builder

*   **xadahiya** ([GitHub](https://github.com/xadahiya))
