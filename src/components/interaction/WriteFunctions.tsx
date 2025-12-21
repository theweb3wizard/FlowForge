'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { separateFunctions } from '@/lib/abi/parser';
import { useContractInteraction } from '@/hooks/useContractInteraction';
import { FunctionExecutor } from './FunctionExecutor';

interface WriteFunctionsProps {
  contractAddress: string;
  abi: any[];
  deployerAddress: string;
}

export function WriteFunctions({ contractAddress, abi, deployerAddress }: WriteFunctionsProps) {
  const { address, isConnected } = useWallet();
  const { writeFunctions } = separateFunctions(abi);
  const { callWriteFunction, isLoading, loadingFunction } = useContractInteraction(
    contractAddress,
    abi
  );
  
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDeployer = address?.toLowerCase() === deployerAddress.toLowerCase();

  const handleExecute = async (functionName: string, args: any[], value?: string) => {
    // Clear previous result/error
    setResults((prev) => {
      const newResults = { ...prev };
      delete newResults[functionName];
      return newResults;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[functionName];
      return newErrors;
    });

    const result = await callWriteFunction(functionName, args, value);

    if (result.success) {
      setResults((prev) => ({ ...prev, [functionName]: result.transactionHash }));
    } else {
      setErrors((prev) => ({ ...prev, [functionName]: result.error }));
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👛</div>
        <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">
          Connect your wallet to interact with this contract
        </p>
      </div>
    );
  }

  // Not the deployer
  if (!isDeployer) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold mb-2">Access Restricted</h3>
        <p className="text-gray-600">
          Only the contract deployer can execute write functions
        </p>
        <p className="text-sm text-gray-500 mt-2 font-mono">
          Deployer: {deployerAddress}
        </p>
      </div>
    );
  }

  if (writeFunctions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        This contract has no write functions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Write functions require a wallet signature and will cost gas fees
        </p>
      </div>

      {writeFunctions.map((func) => (
        <FunctionExecutor
          key={func.name}
          func={func}
          onExecute={(args, value) => handleExecute(func.name, args, value)}
          isLoading={isLoading}
          isLoadingThis={loadingFunction === func.name}
          result={results[func.name]}
          error={errors[func.name]}
          isWriteFunction={true}
        />
      ))}
    </div>
  );
}
