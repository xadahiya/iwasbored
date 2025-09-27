import { useReadContract, useWriteContract } from 'wagmi';
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

const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'; // Sepolia PYUSD address

export const usePYUSDToken = () => {
  const { writeContract } = useWriteContract();

  const getAllowanceConfig = useCallback((owner, spender) => ({
    address: PYUSD_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, spender],
    chainId: sepolia.id,
  }), []);

  const approve = useCallback((spender, amount) => {
    writeContract({
      address: PYUSD_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
      chainId: sepolia.id,
    });
  }, [writeContract]);

  return {
    getAllowanceConfig,
    approve,
  };
};
