'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';

interface CallResult {
  success: boolean;
  result?: any;
  transactionHash?: string;
  error?: string;
}

export function useContractInteraction(contractAddress: string, abi: any[]) {
  const { provider } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFunction, setLoadingFunction] = useState<string | null>(null);

  /**
   * Call a read-only function (view/pure)
   */
  const callReadFunction = async (
    functionName: string,
    args: any[]
  ): Promise<CallResult> => {
    if (!provider) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);

    try {
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const result = await contract[functionName](...args);

      setIsLoading(false);
      setLoadingFunction(null);

      // Format result for display
      let formattedResult = result;
      
      // Handle BigNumber
      if (ethers.BigNumber.isBigNumber(result)) {
        formattedResult = result.toString();
      }
      
      // Handle arrays
      if (Array.isArray(result)) {
        formattedResult = result.map((item) =>
          ethers.BigNumber.isBigNumber(item) ? item.toString() : item
        );
      }

      return { success: true, result: formattedResult };
    } catch (error: any) {
      console.error('Read function error:', error);
      setIsLoading(false);
      setLoadingFunction(null);

      return {
        success: false,
        error: error.message || 'Failed to call function',
      };
    }
  };

  /**
   * Call a state-changing function (write)
   */
  const callWriteFunction = async (
    functionName: string,
    args: any[],
    value?: string
  ): Promise<CallResult> => {
    if (!provider) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Prepare transaction options
      const txOptions: any = {};
      if (value && parseFloat(value) > 0) {
        txOptions.value = ethers.utils.parseEther(value);
      }

      // Send transaction
      const tx = await contract[functionName](...args, txOptions);
      
      // Wait for confirmation
      const receipt = await tx.wait(1);

      setIsLoading(false);
      setLoadingFunction(null);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Write function error:', error);
      setIsLoading(false);
      setLoadingFunction(null);

      // Parse error messages
      let errorMessage = 'Transaction failed';
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  return {
    callReadFunction,
    callWriteFunction,
    isLoading,
    loadingFunction,
  };
}
