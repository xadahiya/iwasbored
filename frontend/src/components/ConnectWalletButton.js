import { useWallet } from '../contexts/WalletContext';

export const ConnectWalletButton = () => {
  const { connectWallet, isConnecting } = useWallet();

  return (
    <button 
      onClick={connectWallet} 
      disabled={isConnecting}
      className="connect-wallet-btn"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};