'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { getWeb3ErrorMessage } from '@/lib/errors';
import { formatOutputValue, parseInputValue } from '@/lib/abi/parser';
import type { AbiFunction, AbiParameter, DecodedEvent } from '@/types/abi';

interface CallResult {
  success: boolean;
  result?: any;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
}

interface GasEstimate {
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost?: string;
}

export function useContractInteraction(contractAddress: string, abi: any[]) {
  const { provider } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFunction, setLoadingFunction] = useState<string | null>(null);
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  /**
   * Initialize contract instance
   */
  useEffect(() => {
    if (provider && contractAddress && abi.length > 0) {
      const contractInstance = new ethers.Contract(contractAddress, abi, provider);
      setContract(contractInstance);
    }
  }, [provider, contractAddress, abi]);

  /**
   * Set up event listeners for all contract events
   */
  useEffect(() => {
    if (!contract) return;

    // Listen to all events
    const handleEvent = async (...eventArgs: any[]) => {
      const event = eventArgs[eventArgs.length - 1]; // Last arg is the event object
      
      try {
        const block = await provider?.getBlock(event.blockNumber);
        
        const decodedEvent: DecodedEvent = {
          eventName: event.event || 'Unknown',
          args: event.args ? Object.fromEntries(
            Object.entries(event.args).filter(([key]) => isNaN(Number(key)))
          ) : {},
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          timestamp: block?.timestamp,
        };

        setEvents((prev) => [decodedEvent, ...prev]);
      } catch (error) {
        console.error('Error processing event:', error);
      }
    };

    // Attach listener for all events
    contract.on('*', handleEvent);

    // Cleanup
    return () => {
      contract.removeAllListeners();
    };
  }, [contract, provider]);

  /**
   * Clear event history
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * Estimate gas for a transaction
   */
  const estimateGas = async (
    functionName: string,
    args: any[],
    value?: string
  ): Promise<GasEstimate | null> => {
    if (!provider || !contract) {
      return null;
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      // Prepare transaction options
      const txOptions: any = {};
      if (value && parseFloat(value) > 0) {
        txOptions.value = ethers.utils.parseEther(value);
      }

      // Estimate gas
      const gasLimit = await contractWithSigner.estimateGas[functionName](...args, txOptions);

      // Get current gas price info (EIP-1559)
      const feeData = await provider.getFeeData();

      // Calculate estimated cost
      let estimatedCost = '0';
      if (feeData.maxFeePerGas) {
        const costInWei = gasLimit.mul(feeData.maxFeePerGas);
        estimatedCost = ethers.utils.formatEther(costInWei);
      }

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedCost,
      };
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      return null;
    }
  };

  /**
   * Call a read-only function (view/pure)
   * Enhanced with better formatting and error handling
   */
  const callReadFunction = async (
    functionName: string,
    args: any[],
    functionAbi?: AbiFunction
  ): Promise<CallResult> => {
    if (!provider) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!contract) {
      return { success: false, error: 'Contract not initialized' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);

    try {
      // Parse input arguments using the enhanced parser
      const parsedArgs = functionAbi?.inputs 
        ? args.map((arg, idx) => parseInputValue(arg, functionAbi.inputs[idx].type, functionAbi.inputs[idx]))
        : args;

      const result = await contract[functionName](...parsedArgs);

      setIsLoading(false);
      setLoadingFunction(null);

      // Format result for display using enhanced formatter
      let formattedResult;
      if (functionAbi?.outputs && functionAbi.outputs.length > 0) {
        // Single output
        if (functionAbi.outputs.length === 1) {
          formattedResult = formatOutputValue(result, functionAbi.outputs[0]);
        } else {
          // Multiple outputs - format each
          formattedResult = result.map((item: any, idx: number) => 
            formatOutputValue(item, functionAbi.outputs![idx])
          );
        }
      } else {
        // Fallback to basic formatting
        formattedResult = formatOutputValue(result);
      }

      return { success: true, result: formattedResult };
    } catch (error: any) {
      console.error('Read function error:', error);
      setIsLoading(false);
      setLoadingFunction(null);

      // Enhanced error message
      const errorMessage = decodeError(error, functionAbi);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Call a state-changing function (write)
   * Enhanced with gas estimation, better error handling, and event support
   */
  const callWriteFunction = async (
    functionName: string,
    args: any[],
    value?: string,
    functionAbi?: AbiFunction,
    gasLimit?: string
  ): Promise<CallResult> => {
    if (!provider) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!contract) {
      return { success: false, error: 'Contract not initialized' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      // Parse input arguments using the enhanced parser
      const parsedArgs = functionAbi?.inputs 
        ? args.map((arg, idx) => parseInputValue(arg, functionAbi.inputs[idx].type, functionAbi.inputs[idx]))
        : args;

      // Prepare transaction options
      const txOptions: any = {};
      
      // Add value for payable functions
      if (value && parseFloat(value) > 0) {
        txOptions.value = ethers.utils.parseEther(value);
      }

      // Add gas limit if provided, otherwise let ethers estimate
      if (gasLimit) {
        txOptions.gasLimit = ethers.BigNumber.from(gasLimit);
      }

      // Send transaction
      const tx = await contractWithSigner[functionName](...parsedArgs, txOptions);
      
      // Wait for confirmation with detailed status
      const receipt = await provider.waitForTransaction(tx.hash, 1, 120000); // 1 conf, 2 min timeout

      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction was reverted by the network.');
      }

      setIsLoading(false);
      setLoadingFunction(null);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      console.error('Write function error:', error);
      setIsLoading(false);
      setLoadingFunction(null);

      // Enhanced error message with decoding
      const errorMessage = decodeError(error, functionAbi);

      return { 
        success: false, 
        error: errorMessage,
      };
    }
  };

  /**
   * Decode contract errors into human-readable messages
   */
  const decodeError = (error: any, functionAbi?: AbiFunction): string => {
    // Check for user rejection
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      return 'Transaction rejected by user';
    }

    // Check for insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds to complete transaction';
    }

    // Try to decode revert reason
    if (error.reason) {
      return error.reason;
    }

    // Try to extract custom error from data
    if (error.data) {
      try {
        // Parse custom error selector (first 4 bytes)
        const errorSelector = error.data.slice(0, 10);
        
        // Common error selectors
        const commonErrors: Record<string, string> = {
          '0x08c379a0': 'Error', // Standard revert
          '0x4e487b71': 'Panic', // Panic error
        };

        if (commonErrors[errorSelector]) {
          // Try to decode the message
          if (error.data.length > 10) {
            try {
              const decoded = ethers.utils.defaultAbiCoder.decode(
                ['string'],
                '0x' + error.data.slice(10)
              );
              return decoded[0];
            } catch {
              return commonErrors[errorSelector];
            }
          }
        }
      } catch (decodeError) {
        console.error('Error decoding:', decodeError);
      }
    }

    // Check for specific error messages in the error object
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.message) {
      // Clean up common error message patterns
      let message = error.message;
      
      // Remove ethers.js prefixes
      message = message.replace(/^execution reverted:?\s*/i, '');
      message = message.replace(/^Error:?\s*/i, '');
      
      // Handle "call revert exception" 
      if (message.includes('call revert exception')) {
        return 'Transaction would fail. Check function requirements.';
      }

      return message;
    }

    // Fallback to generic web3 error message
    return getWeb3ErrorMessage(error);
  };

  /**
   * Query historical events
   */
  const queryEvents = async (
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | string = 'latest'
  ): Promise<DecodedEvent[]> => {
    if (!contract) return [];

    try {
      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      const decodedEvents: DecodedEvent[] = await Promise.all(
        events.map(async (event) => {
          const block = await provider?.getBlock(event.blockNumber);
          return {
            eventName: event.event || eventName,
            args: event.args ? Object.fromEntries(
              Object.entries(event.args).filter(([key]) => isNaN(Number(key)))
            ) : {},
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
            timestamp: block?.timestamp,
          };
        })
      );

      return decodedEvents;
    } catch (error) {
      console.error('Error querying events:', error);
      return [];
    }
  };

  return {
    callReadFunction,
    callWriteFunction,
    estimateGas,
    queryEvents,
    clearEvents,
    isLoading,
    loadingFunction,
    events,
    contract,
  };
}