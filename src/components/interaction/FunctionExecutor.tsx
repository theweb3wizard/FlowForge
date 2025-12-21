'use client';

import { useState } from 'react';
import { AbiFunction } from '@/types/abi';
import { getInputType, getPlaceholder, validateInput } from '@/lib/abi/parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FunctionExecutorProps {
  func: AbiFunction;
  onExecute: (args: any[], value?: string) => Promise<void>;
  isLoading: boolean;
  isLoadingThis: boolean;
  result?: any;
  error?: string;
  isWriteFunction?: boolean;
}

export function FunctionExecutor({
  func,
  onExecute,
  isLoading,
  isLoadingThis,
  result,
  error,
  isWriteFunction = false,
}: FunctionExecutorProps) {
  const [args, setArgs] = useState<Record<string, any>>({});
  const [ethValue, setEthValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleArgChange = (paramName: string, paramType: string, value: string) => {
    setArgs((prev) => ({ ...prev, [paramName]: value }));

    // Validate
    if (value && !validateInput(value, paramType)) {
      setValidationErrors((prev) => ({
        ...prev,
        [paramName]: `Invalid ${paramType} format`,
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  const handleExecute = async () => {
    const argValues = func.inputs.map((input) => args[input.name] || '');
    
    // Convert to proper types
    const processedArgs = argValues.map((value, index) => {
      const paramType = func.inputs[index].type;
      
      if (paramType.startsWith('uint') || paramType.startsWith('int')) {
        return value;
      }
      if (paramType === 'bool') {
        return value === 'true' || value === true;
      }
      if (paramType.includes('[]')) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    });

    await onExecute(processedArgs, isWriteFunction ? ethValue : undefined);
  };

  const hasErrors = Object.keys(validationErrors).length > 0;
  const isPayable = func.stateMutability === 'payable';

  return (
    <div className="border rounded-lg p-4">
      {/* Function Name */}
      <div className="mb-4">
        <h3 className="text-lg font-bold">{func.name}</h3>
        {func.stateMutability === 'payable' && (
          <span className="text-xs text-green-600 font-medium">💰 Payable</span>
        )}
      </div>

      {/* Input Parameters */}
      {func.inputs.length > 0 && (
        <div className="space-y-3 mb-4">
          {func.inputs.map((input, index) => {
            const inputType = getInputType(input.type);
            const placeholder = getPlaceholder(input);
            const error = validationErrors[input.name];

            return (
              <div key={index}>
                <Label htmlFor={`${func.name}-${input.name}`}>
                  {input.name}
                  <span className="text-xs text-gray-500 ml-2">({input.type})</span>
                </Label>

                {inputType === 'textarea' ? (
                  <Textarea
                    id={`${func.name}-${input.name}`}
                    placeholder={placeholder}
                    value={args[input.name] || ''}
                    onChange={(e) => handleArgChange(input.name, input.type, e.target.value)}
                    className={error ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                ) : (
                  <Input
                    id={`${func.name}-${input.name}`}
                    type={inputType}
                    placeholder={placeholder}
                    value={args[input.name] || ''}
                    onChange={(e) => handleArgChange(input.name, input.type, e.target.value)}
                    className={error ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                )}

                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* ETH Value (for payable functions) */}
      {isPayable && (
        <div className="mb-4">
          <Label htmlFor={`${func.name}-value`}>
            ETH Value (optional)
          </Label>
          <Input
            id={`${func.name}-value`}
            type="number"
            step="0.001"
            placeholder="0.0"
            value={ethValue}
            onChange={(e) => setEthValue(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={isLoading || hasErrors}
        className="w-full mb-3"
      >
        {isLoadingThis ? 'Executing...' : isWriteFunction ? 'Execute' : 'Call'}
      </Button>

      {/* Result Display */}
      {result !== undefined && result !== null && !isWriteFunction && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Result:</p>
          <pre className="text-sm text-green-900 whitespace-pre-wrap break-all">
            {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
          </pre>
        </div>
      )}

      {/* Transaction Hash (for write functions) */}
      {isWriteFunction && result && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Transaction Hash:</p>
          <p className="text-sm text-blue-900 font-mono break-all">{result}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs text-red-700 font-medium mb-1">Error:</p>
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}
    </div>
  );
}
