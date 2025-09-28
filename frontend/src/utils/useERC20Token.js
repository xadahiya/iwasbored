import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCallback } from 'react';

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      },
      {
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const PYUSD_CONTRACT_ADDRESS = '0xEfeFbB5e484b384A6a31f07F862bDA4D21267De3'; // Sepolia PYUSD address

export const usePYUSDToken = () => {
  const { chainId } = useAccount(); // Get chainId from connected wallet
  const { writeContract } = useWriteContract();

  const getAllowanceConfig = useCallback((owner, spender) => ({
    address: PYUSD_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, spender],
    chainId: chainId || sepolia.id, // Use connected chainId or fallback to sepolia
  }), [chainId]);

  const approve = useCallback((spender, amount) => {
    writeContract({
      address: PYUSD_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
      chainId: chainId || sepolia.id, // Use connected chainId or fallback to sepolia
    });
  }, [writeContract, chainId]);

  return {
    getAllowanceConfig,
    approve,
  };
};
