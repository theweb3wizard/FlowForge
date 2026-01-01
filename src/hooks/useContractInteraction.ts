'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { formatOutputValue } from '@/lib/abi/parser';
import type { AbiFunction, DecodedEvent } from '@/types/abi';
import { callReadFunction as serviceCallRead, callWriteFunction as serviceCallWrite, estimateGas as serviceEstimateGas } from '@/lib/web3/transactions';

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
    const signer = await provider.getSigner();
    return serviceEstimateGas(contract, signer, functionName, args, value);
  };

  /**
   * Call a read-only function (view/pure)
   */
  const callReadFunction = async (
    functionName: string,
    args: any[],
    functionAbi?: AbiFunction
  ): Promise<CallResult> => {
    if (!contract) {
      return { success: false, error: 'Contract not initialized' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);

    try {
      const result = await serviceCallRead(contract, functionName, args, functionAbi);

      // Format result for display using enhanced formatter
      let formattedResult;
      if (functionAbi?.outputs && functionAbi.outputs.length > 0) {
        if (functionAbi.outputs.length === 1) {
          formattedResult = formatOutputValue(result, functionAbi.outputs[0]);
        } else {
          formattedResult = result.map((item: any, idx: number) => 
            formatOutputValue(item, functionAbi.outputs![idx])
          );
        }
      } else {
        formattedResult = formatOutputValue(result);
      }
      
      return { success: true, result: formattedResult };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      setLoadingFunction(null);
    }
  };

  /**
   * Call a state-changing function (write)
   */
  const callWriteFunction = async (
    functionName: string,
    args: any[],
    value?: string,
    functionAbi?: AbiFunction,
    gasLimit?: string
  ): Promise<CallResult> => {
    if (!provider || !contract) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setLoadingFunction(functionName);
    
    try {
      const signer = await provider.getSigner();
      const result = await serviceCallWrite(contract, signer, functionName, args, value, functionAbi, gasLimit);
      return {
        success: true,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      setLoadingFunction(null);
    }
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
