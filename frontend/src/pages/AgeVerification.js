import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import Header from '../components/Header';
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  getUniversalLink,
} from "@selfxyz/qrcode";
import './AgeVerification.css';

const AgeVerification = () => {
  const navigate = useNavigate();
  const { address, connectWallet, testWalletConnection } = useWallet();
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selfApp, setSelfApp] = useState(null);
  const [universalLink, setUniversalLink] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use useMemo to cache the excluded countries array
  const excludedCountries = useMemo(() => [], []); // No countries excluded for age verification

  // Check if user already verified (you would implement this with your backend/contract)
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (address) {
        // In a real implementation, you would check the smart contract
        // or your backend to see if this address is already verified
        const verified = localStorage.getItem(`verified_${address}`);
        if (verified === 'true') {
          setIsVerified(true);
        }
      }
    };

    checkVerificationStatus();
  }, [address]);

  // Initialize Self Protocol app
  useEffect(() => {
    if (!address) return;

    try {
      console.log("🔧 Self Protocol Configuration:");
      console.log("Contract Address:", process.env.REACT_APP_AGE_VERIFICATION_CONTRACT);
      console.log("Scope:", process.env.REACT_APP_SELF_SCOPE || "iwasbored");
      console.log("User ID:", address);

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.REACT_APP_SELF_APP_NAME || "IWasBored Age Verification",
        scope: process.env.REACT_APP_SELF_SCOPE || "iwasbored",
        endpoint: process.env.REACT_APP_SELF_ENDPOINT || process.env.REACT_APP_AGE_VERIFICATION_CONTRACT || "0x0000000000000000000000000000000000000000",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: address,
        endpointType: "celo", // Use "celo" for mainnet
        userIdType: "hex",
        userDefinedData: "Age verification for betting platform",
        disclosures: {
          // Verification requirements
          minimumAge: 18,
          excludedCountries: excludedCountries,
          ofac: false, // Set to true for OFAC compliance if needed
          // What you want users to reveal (optional)
          name: false,
          nationality: false,
          date_of_birth: false,
          gender: false,
          passport_number: false,
          expiry_date: false,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      displayToast("Failed to initialize verification system");
    }
  }, [excludedCountries, address]);

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = () => {
    if (!universalLink) return;

    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        displayToast("Universal link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        displayToast("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink) return;

    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  const handleSuccessfulVerification = () => {
    setIsLoading(true);
    displayToast("Verification successful! Processing...");
    
    // Store verification status locally (in production, this would be handled by your smart contract)
    localStorage.setItem(`verified_${address}`, 'true');
    
    setTimeout(() => {
      setIsVerified(true);
      setIsLoading(false);
      displayToast("Age verification complete! You can now use the platform.");
    }, 2000);
  };

  const handleVerificationError = (error) => {
    console.error("Verification error:", error);
    displayToast("Verification failed. Please try again.");
  };

  const proceedToPlatform = () => {
    navigate('/swipe');
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      displayToast("Failed to connect wallet. Please try again.");
    }
  };

  if (!address) {
    return (
      <div className="age-verification">
        <Header />
        <div className="verification-content">
          <div className="verification-container">
            <div className="verification-header">
              <h1>Age Verification Required</h1>
              <p>To use our betting platform, you must verify that you are 18 years or older.</p>
            </div>
            
            <div className="connect-wallet-section">
              <div className="connect-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>First, connect your wallet to start the age verification process.</p>
              <button 
                className="connect-wallet-button"
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </button>
              
              {/* Debug button - remove in production */}
              <button 
                className="connect-wallet-button"
                onClick={() => {
                  console.log('🐛 Debug button clicked');
                  testWalletConnection();
                }}
                style={{ 
                  marginTop: '10px', 
                  backgroundColor: '#666',
                  fontSize: '12px'
                }}
              >
                🐛 Debug Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="age-verification">
        <Header />
        <div className="verification-content">
          <div className="verification-container">
            <div className="verification-success">
              <div className="success-icon">✅</div>
              <h1>Age Verification Complete!</h1>
              <p>You have successfully verified that you are 18 years or older.</p>
              <p>You can now access all features of our betting platform.</p>
              
              <div className="verification-details">
                <div className="detail-item">
                  <span className="detail-label">Wallet Address:</span>
                  <span className="detail-value">{address}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Verification Status:</span>
                  <span className="detail-value verified">Verified ✓</span>
                </div>
              </div>
              
              <button 
                className="proceed-button"
                onClick={proceedToPlatform}
              >
                Start Betting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="age-verification">
      <Header />
      <div className="verification-content">
        <div className="verification-container">
          <div className="verification-header">
            <h1>Age Verification Required</h1>
            <p>Please verify that you are 18 years or older using the Self Protocol.</p>
          </div>

          <div className="verification-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Download Self App</h3>
                <p>Download the Self Protocol app from the App Store or Google Play</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Scan QR Code</h3>
                <p>Use the Self app to scan the QR code below</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Verify Identity</h3>
                <p>Follow the prompts to verify your identity documents</p>
              </div>
            </div>
          </div>

          <div className="qr-code-section">
            <div className="qr-code-container">
              {selfApp && !isLoading ? (
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleSuccessfulVerification}
                  onError={handleVerificationError}
                />
              ) : (
                <div className="qr-loading">
                  <div className="qr-placeholder">
                    {isLoading ? (
                      <>
                        <div className="spinner"></div>
                        <p>Processing verification...</p>
                      </>
                    ) : (
                      <p>Loading QR Code...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="qr-actions">
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!universalLink || isLoading}
                className="action-button secondary"
              >
                {linkCopied ? "Copied!" : "Copy Link"}
              </button>

              <button
                type="button"
                onClick={openSelfApp}
                disabled={!universalLink || isLoading}
                className="action-button primary"
              >
                Open Self App
              </button>
            </div>
          </div>

          <div className="wallet-info">
            <span className="wallet-label">Connected Wallet:</span>
            <div className="wallet-address">{address}</div>
          </div>

          <div className="verification-info">
            <h3>What We Verify</h3>
            <ul>
              <li>✓ You are 18 years or older</li>
              <li>✓ Valid government-issued ID</li>
              <li>✓ Identity document authenticity</li>
            </ul>
            
            <div className="privacy-note">
              <h4>Privacy Protected</h4>
              <p>Your personal information is verified but not stored by our platform. 
                 Self Protocol uses zero-knowledge proofs to verify your age without 
                 revealing other personal details.</p>
            </div>
          </div>
        </div>

        {showToast && (
          <div className="toast">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgeVerification;
