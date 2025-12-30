'use client';

import { useState, useEffect } from 'react';
import { AbiFunction, AbiParameter } from '@/types/abi';
import { 
  getInputType, 
  getPlaceholder, 
  validateInput,
  formatParameterType,
  isStructType,
  isPayableFunction
} from '@/lib/abi/parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FunctionExecutorProps {
  func: AbiFunction;
  onExecute: (args: any[], value?: string) => Promise<void>;
  onEstimateGas?: (args: any[], value?: string) => Promise<{ gasLimit: string; estimatedCost?: string } | null>;
  isLoading: boolean;
  isLoadingThis: boolean;
  result?: any;
  error?: string;
  gasUsed?: string;
  isWriteFunction?: boolean;
}

/**
 * Recursive component for rendering parameter inputs
 * Handles simple types, arrays, and nested structs
 */
interface ParameterInputProps {
  param: AbiParameter;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  path?: string; // For nested error tracking
}

function ParameterInput({ 
  param, 
  value, 
  onChange, 
  disabled, 
  error,
  path = '' 
}: ParameterInputProps) {
  const currentPath = path ? `${path}.${param.name}` : param.name;
  
  // Handle struct/tuple types with recursive rendering
  if (isStructType(param)) {
    return (
      <fieldset className="border rounded-md p-3 space-y-3">
        <legend className="text-sm font-medium px-2">
          {param.name}
          <span className="text-xs text-gray-500 ml-2">
            ({formatParameterType(param.type, param)})
          </span>
        </legend>
        
        {param.components?.map((component, idx) => {
          const componentValue = value?.[component.name] || '';
          
          return (
            <ParameterInput
              key={idx}
              param={component}
              value={componentValue}
              onChange={(newValue) => {
                const updatedStruct = { ...(value || {}) };
                updatedStruct[component.name] = newValue;
                onChange(updatedStruct);
              }}
              disabled={disabled}
              path={currentPath}
            />
          );
        })}
      </fieldset>
    );
  }

  // Handle simple types
  const inputType = getInputType(param.type, param);
  const placeholder = getPlaceholder(param);
  const displayType = formatParameterType(param.type, param);

  return (
    <div>
      <Label htmlFor={currentPath}>
        {param.name}
        <span className="text-xs text-gray-500 ml-2">({displayType})</span>
      </Label>

      {inputType === 'textarea' ? (
        <Textarea
          id={currentPath}
          placeholder={placeholder}
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-500' : ''}
          disabled={disabled}
          rows={3}
        />
      ) : inputType === 'checkbox' ? (
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            id={currentPath}
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4"
          />
          <Label htmlFor={currentPath} className="font-normal cursor-pointer">
            {value === true || value === 'true' ? 'True' : 'False'}
          </Label>
        </div>
      ) : (
        <Input
          id={currentPath}
          type={inputType}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-500' : ''}
          disabled={disabled}
        />
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/**
 * Main FunctionExecutor Component
 * Enhanced with struct support, gas estimation, and better UX
 */
export function FunctionExecutor({
  func,
  onExecute,
  onEstimateGas,
  isLoading,
  isLoadingThis,
  result,
  error,
  gasUsed,
  isWriteFunction = false,
}: FunctionExecutorProps) {
  const [args, setArgs] = useState<Record<string, any>>({});
  const [ethValue, setEthValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [gasEstimate, setGasEstimate] = useState<{ gasLimit: string; estimatedCost?: string } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const isPayable = isPayableFunction(func);
  const hasInputs = func.inputs.length > 0;

  /**
   * Handle argument changes with validation
   */
  const handleArgChange = (paramName: string, param: AbiParameter, value: any) => {
    setArgs((prev) => ({ ...prev, [paramName]: value }));

    // Clear gas estimate when args change
    setGasEstimate(null);

    // Validate input
    if (value !== '' && value !== undefined && value !== null) {
      const validation = validateInput(value, param.type, param);
      
      if (!validation.valid) {
        setValidationErrors((prev) => ({
          ...prev,
          [paramName]: validation.error || `Invalid ${param.type}`,
        }));
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[paramName];
          return newErrors;
        });
      }
    } else {
      // Clear error if empty
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  /**
   * Handle gas estimation for write functions
   */
  const handleEstimateGas = async () => {
    if (!onEstimateGas || !isWriteFunction) return;

    setIsEstimating(true);
    
    try {
      const argValues = func.inputs.map((input) => args[input.name] || '');
      const estimate = await onEstimateGas(argValues, ethValue);
      setGasEstimate(estimate);
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setGasEstimate(null);
    } finally {
      setIsEstimating(false);
    }
  };

  /**
   * Execute the function
   */
  const handleExecute = async () => {
    const argValues = func.inputs.map((input) => args[input.name] || '');
    await onExecute(argValues, isWriteFunction && ethValue ? ethValue : undefined);
  };

  const hasErrors = Object.keys(validationErrors).length > 0;
  const canExecute = !isLoading && !hasErrors;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Function Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{func.name}</h3>
          <div className="flex gap-2">
            {isPayable && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                💰 Payable
              </span>
            )}
            {isWriteFunction && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                ✍️ Write
              </span>
            )}
            {!isWriteFunction && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                👁️ Read
              </span>
            )}
          </div>
        </div>
        
        {/* Function outputs display */}
        {func.outputs && func.outputs.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Returns: {func.outputs.map(o => formatParameterType(o.type, o)).join(', ')}
          </p>
        )}
      </div>

      {/* Input Parameters with Recursive Rendering */}
      {hasInputs && (
        <div className="space-y-3">
          {func.inputs.map((input, index) => (
            <ParameterInput
              key={index}
              param={input}
              value={args[input.name]}
              onChange={(value) => handleArgChange(input.name, input, value)}
              disabled={isLoading}
              error={validationErrors[input.name]}
            />
          ))}
        </div>
      )}

      {/* ETH Value Input (for payable functions) */}
      {isPayable && (
        <div>
          <Label htmlFor={`${func.name}-eth-value`}>
            ETH Amount to Send
            <span className="text-xs text-gray-500 ml-2">(optional)</span>
          </Label>
          <Input
            id={`${func.name}-eth-value`}
            type="number"
            step="0.001"
            min="0"
            placeholder="0.0"
            value={ethValue}
            onChange={(e) => {
              setEthValue(e.target.value);
              setGasEstimate(null); // Clear estimate when value changes
            }}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount of ETH to send with this transaction
          </p>
        </div>
      )}

      {/* Gas Estimation (for write functions) */}
      {isWriteFunction && onEstimateGas && (
        <div>
          <Button
            onClick={handleEstimateGas}
            disabled={isLoading || hasErrors || isEstimating}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isEstimating ? 'Estimating...' : '⛽ Estimate Gas'}
          </Button>
          
          {gasEstimate && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs">
              <p className="text-blue-700">
                <span className="font-medium">Gas Limit:</span> {gasEstimate.gasLimit}
              </p>
              {gasEstimate.estimatedCost && (
                <p className="text-blue-700 mt-1">
                  <span className="font-medium">Est. Cost:</span> ~{parseFloat(gasEstimate.estimatedCost).toFixed(6)} ETH
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={!canExecute}
        className="w-full"
        variant={isWriteFunction ? "default" : "secondary"}
      >
        {isLoadingThis ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            {isWriteFunction ? 'Executing Transaction...' : 'Calling Function...'}
          </>
        ) : isWriteFunction ? (
          '✍️ Execute Transaction'
        ) : (
          '👁️ Call Function'
        )}
      </Button>

      {/* Validation Errors Summary */}
      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-xs text-yellow-800 font-medium">⚠️ Please fix the following errors:</p>
          <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{field}: {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Result Display (for read functions) */}
      {result !== undefined && result !== null && !isWriteFunction && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-700 font-medium mb-2">✅ Result:</p>
          <pre className="text-sm text-green-900 whitespace-pre-wrap break-all font-mono">
            {result}
          </pre>
        </div>
      )}

      {/* Transaction Success (for write functions) */}
      {isWriteFunction && result && !error && (
        <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
          <p className="text-xs text-green-700 font-medium">✅ Transaction Successful</p>
          <div>
            <p className="text-xs text-green-600 font-medium">Transaction Hash:</p>
            <p className="text-sm text-green-900 font-mono break-all">{result}</p>
          </div>
          {gasUsed && (
            <div>
              <p className="text-xs text-green-600 font-medium">Gas Used:</p>
              <p className="text-sm text-green-900">{gasUsed}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs text-red-700 font-medium mb-1">❌ Error:</p>
          <p className="text-sm text-red-900 whitespace-pre-wrap">{error}</p>
        </div>
      )}
    </div>
  );
}