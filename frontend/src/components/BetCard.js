import React from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ethers } from 'ethers';
import { useOracleContract } from '../utils/OracleContract';
import { usePYUSDToken } from '../utils/useERC20Token';
import './BetCard.css';

function BetCard({ prediction, onSwipe }) {
    const { address } = useAccount();
    const { buyPosition } = useOracleContract();
    const { getAllowanceConfig, approve } = usePYUSDToken();
    const [isExpired, setIsExpired] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const ORACLE_CONTRACT_ADDRESS = '0xC16a6c2720308DE8d7811428A18D3810513A677C'; // Oracle contract address

    const { data: allowance, isLoading: isAllowanceLoading, refetch: refetchAllowance } = useReadContract(
        getAllowanceConfig(address, ORACLE_CONTRACT_ADDRESS),
        { enabled: !!address }
    );

    useEffect(() => {
        if (allowance !== undefined && address) {
            // Assuming a fixed bet amount for simplicity, e.g., 0.01 ETH (which is 10^16 wei)
            // This should ideally come from the UI or prediction data
            const requiredAllowance = ethers.parseEther("0.01"); 
            setNeedsApproval(allowance < requiredAllowance);
        }
    }, [allowance, address]);

    useEffect(() => {
        const checkExpiration = () => {
            const currentTime = Math.floor(Date.now() / 1000);
            setIsExpired(prediction.endTime <= currentTime);
        };

        checkExpiration();
        const intervalId = setInterval(checkExpiration, 1000); // Check every second

        return () => clearInterval(intervalId);
    }, [prediction.endTime]);

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

    const handleBet = async (outcome) => {
        if (isExpired) {
            alert("This prediction has expired and no longer accepts bets.");
            return;
        }
        if (!address) {
            alert("Please connect your wallet to place a bet.");
            return;
        }
        if (needsApproval) {
            alert("Please approve the PYUSD token spending first.");
            return;
        }
        try {
            const outcomeIndex = outcome ? 1 : 0; // Assuming true maps to 1, false to 0
            const amount = ethers.parseEther("0.01"); // Placeholder for 0.01 ETH
            const minOutcomeTokensToBuy = 0; // Placeholder
            const conditionTokensReceiver = address; // Receiver is the current wallet address

            await buyPosition(prediction.id, outcomeIndex, amount, minOutcomeTokensToBuy, conditionTokensReceiver);
            onSwipe();
        } catch (error) {
            console.error("Betting failed:", error);
            alert("Failed to place bet. See console for details.");
        }
    };
    return (
        <div className={`bet-card ${isExpired ? 'expired' : ''}`}>
            <PredictionCard prediction={prediction} />
            <div className="bet-buttons">
                {needsApproval ? (
                    <button onClick={handleApprove} disabled={isApproving || isExpired}>
                        {isApproving ? 'Approving...' : 'Approve PYUSD'}
                    </button>
                ) : (
                    <>
                        <button onClick={() => handleBet(true)} disabled={isExpired}>Yes</button>
                        <button onClick={() => handleBet(false)} disabled={isExpired}>No</button>
                    </>
                )}
            </div>
        </div>
    );
}

function getCryptoIcon(question) {
  if (question.includes('ETH') || question.includes('Ethereum')) return '◈';
  if (question.includes('BTC') || question.includes('Bitcoin')) return '₿';
  if (question.includes('DOGE') || question.includes('Dogecoin')) return 'Ð';
  return '💰';
}

function getCryptoName(question) {
  if (question.includes('ETH') || question.includes('Ethereum')) return 'Ethereum';
  if (question.includes('BTC') || question.includes('Bitcoin')) return 'Bitcoin';
  if (question.includes('DOGE') || question.includes('Dogecoin')) return 'Dogecoin';
  return 'Crypto';
}

export default BetCard;
