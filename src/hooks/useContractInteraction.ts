'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { getWeb3ErrorMessage } from '@/lib/errors';

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
      if (result instanceof ethers.BigNumber) {
        formattedResult = result.toString();
      }
      
      // Handle arrays
      if (Array.isArray(result)) {
        formattedResult = result.map((item) =>
          item instanceof ethers.BigNumber ? item.toString() : item
        );
      }

      return { success: true, result: formattedResult };
    } catch (error: any) {
      console.error('Read function error:', error);
      setIsLoading(false);
      setLoadingFunction(null);

      return {
        success: false,
        error: getWeb3ErrorMessage(error),
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
      const receipt = await provider.waitForTransaction(tx.hash, 1, 120000); // 1 conf, 2 min timeout

      if (receipt.status === 0) {
        throw new Error('Transaction was reverted by the network.');
      }

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

      return { success: false, error: getWeb3ErrorMessage(error) };
    }
  };

  return {
    callReadFunction,
    callWriteFunction,
    isLoading,
    loadingFunction,
  };
}
