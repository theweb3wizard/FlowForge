import { AbiFunction, AbiParameter, ParsedConstructor } from '@/types/abi';

/**
 * Extract constructor from ABI
 */
export function parseConstructor(abi: any[]): ParsedConstructor {
  const constructor = abi.find((item) => item.type === 'constructor');

  if (!constructor) {
    return {
      inputs: [],
      hasConstructor: false,
    };
  }

  return {
    inputs: constructor.inputs || [],
    hasConstructor: true,
  };
}

/**
 * Get all functions from ABI (excluding constructor)
 */
export function parseFunctions(abi: any[]): AbiFunction[] {
  return abi.filter(
    (item) => item.type === 'function'
  ) as AbiFunction[];
}

/**
 * Separate read and write functions
 */
export function separateFunctions(abi: any[]): {
  readFunctions: AbiFunction[];
  writeFunctions: AbiFunction[];
} {
  const functions = parseFunctions(abi);

  const readFunctions = functions.filter(
    (fn) => fn.stateMutability === 'view' || fn.stateMutability === 'pure'
  );

  const writeFunctions = functions.filter(
    (fn) => fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable'
  );

  return { readFunctions, writeFunctions };
}

/**
 * Determine HTML input type based on Solidity type
 */
export function getInputType(solidityType: string): string {
  if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
    return 'number';
  }
  if (solidityType === 'address') {
    return 'text';
  }
  if (solidityType === 'bool') {
    return 'checkbox';
  }
  if (solidityType === 'string') {
    return 'text';
  }
  if (solidityType.startsWith('bytes')) {
    return 'text';
  }
  if (solidityType.includes('[]')) {
    return 'textarea'; // Arrays require JSON input
  }
  return 'text'; // Default
}

/**
 * Validate input based on Solidity type
 */
export function validateInput(value: any, solidityType: string): boolean {
  if (solidityType === 'address') {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }
  if (solidityType.startsWith('uint')) {
    return !isNaN(value) && Number(value) >= 0;
  }
  if (solidityType.startsWith('int')) {
    return !isNaN(value);
  }
  if (solidityType === 'bool') {
    return value === true || value === false || value === 'true' || value === 'false';
  }
  return true; // Allow all other types
}

/**
 * Format parameter type for display
 */
export function formatParameterType(type: string): string {
  // Simplify complex types for UI display
  return type.replace('uint256', 'number')
    .replace('int256', 'number')
    .replace('bytes32', 'bytes')
    .replace('address', 'wallet address');
}

/**
 * Get placeholder text for input based on type
 */
export function getPlaceholder(param: AbiParameter): string {
  const { name, type } = param;
  
  if (type === 'address') return '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  if (type.startsWith('uint') || type.startsWith('int')) return '0';
  if (type === 'bool') return 'true or false';
  if (type === 'string') return `Enter ${name}`;
  if (type.startsWith('bytes')) return '0x...';
  if (type.includes('[]')) return '["item1", "item2"]';
  
  return `Enter ${name}`;
}
