'use client';

import { useState } from 'react';
import { separateFunctions } from '@/lib/abi/parser';
import { useContractInteraction } from '@/hooks/useContractInteraction';
import { FunctionExecutor } from './FunctionExecutor';

interface ReadFunctionsProps {
  contractAddress: string;
  abi: any[];
}

export function ReadFunctions({ contractAddress, abi }: ReadFunctionsProps) {
  const { readFunctions } = separateFunctions(abi);
  const { callReadFunction, isLoading, loadingFunction } = useContractInteraction(
    contractAddress,
    abi
  );
  
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleExecute = async (functionName: string, args: any[]) => {
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

    const result = await callReadFunction(functionName, args);

    if (result.success) {
      setResults((prev) => ({ ...prev, [functionName]: result.result }));
    } else {
      setErrors((prev) => ({ ...prev, [functionName]: result.error }));
    }
  };

  if (readFunctions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        This contract has no read functions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Read functions don't require a wallet signature and don't cost gas
      </p>

      {readFunctions.map((func) => (
        <FunctionExecutor
          key={func.name}
          func={func}
          onExecute={(args) => handleExecute(func.name, args)}
          isLoading={isLoading}
          isLoadingThis={loadingFunction === func.name}
          result={results[func.name]}
          error={errors[func.name]}
          isWriteFunction={false}
        />
      ))}
    </div>
  );
}
