import { AbiFunction, AbiParameter, ParsedConstructor, AbiEvent, AbiError } from '@/types/abi';

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
 * Get all events from ABI
 */
export function parseEvents(abi: any[]): AbiEvent[] {
  return abi.filter(
    (item) => item.type === 'event'
  ) as AbiEvent[];
}

/**
 * Get all errors from ABI (custom errors)
 */
export function parseErrors(abi: any[]): AbiError[] {
  return abi.filter(
    (item) => item.type === 'error'
  ) as AbiError[];
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
 * Check if a parameter is a struct/tuple (has components)
 */
export function isStructType(param: AbiParameter): boolean {
  return !!param.components && param.components.length > 0;
}

/**
 * Check if a type is an array
 */
export function isArrayType(type: string): boolean {
  return type.includes('[]');
}

/**
 * Extract base type from array type
 * e.g., "uint256[]" -> "uint256", "address[][]" -> "address[]"
 */
export function getBaseType(type: string): string {
  return type.replace(/\[\]$/, '');
}

/**
 * Check if type is a fixed-size array
 * e.g., "uint256[5]" returns 5, "uint256[]" returns null
 */
export function getFixedArraySize(type: string): number | null {
  const match = type.match(/\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Determine HTML input type based on Solidity type
 * Enhanced to handle structs and complex types
 */
export function getInputType(solidityType: string, param?: AbiParameter): string {
  // Check for struct first
  if (param && isStructType(param)) {
    return 'struct'; // Special marker for recursive rendering
  }

  // Handle arrays
  if (isArrayType(solidityType)) {
    return 'textarea'; // Arrays require JSON input
  }

  // Handle basic types
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

  return 'text'; // Default
}

/**
 * Validate input based on Solidity type
 * Enhanced with better validation for all types
 */
export function validateInput(value: any, solidityType: string, param?: AbiParameter): { 
  valid: boolean; 
  error?: string;
} {
  // Handle empty values
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: 'Value is required' };
  }

  // Handle structs - recursive validation
  if (param && isStructType(param)) {
    return validateStructInput(value, param);
  }

  // Handle arrays
  if (isArrayType(solidityType)) {
    return validateArrayInput(value, solidityType);
  }

  // Address validation
  if (solidityType === 'address') {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return { valid: false, error: 'Invalid Ethereum address format' };
    }
    return { valid: true };
  }

  // Unsigned integer validation
  if (solidityType.startsWith('uint')) {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    if (num < 0) {
      return { valid: false, error: 'Must be a positive number' };
    }
    // Check bit size (e.g., uint8 max is 255)
    const bitSize = parseInt(solidityType.replace('uint', '')) || 256;
    const maxValue = Math.pow(2, bitSize) - 1;
    if (num > maxValue) {
      return { valid: false, error: `Exceeds maximum value for ${solidityType} (${maxValue})` };
    }
    return { valid: true };
  }

  // Signed integer validation
  if (solidityType.startsWith('int')) {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    const bitSize = parseInt(solidityType.replace('int', '')) || 256;
    const maxValue = Math.pow(2, bitSize - 1) - 1;
    const minValue = -Math.pow(2, bitSize - 1);
    if (num > maxValue || num < minValue) {
      return { valid: false, error: `Out of range for ${solidityType} (${minValue} to ${maxValue})` };
    }
    return { valid: true };
  }

  // Boolean validation
  if (solidityType === 'bool') {
    if (value === true || value === false || value === 'true' || value === 'false') {
      return { valid: true };
    }
    return { valid: false, error: 'Must be true or false' };
  }

  // Bytes validation
  if (solidityType.startsWith('bytes')) {
    if (!/^0x[a-fA-F0-9]*$/.test(value)) {
      return { valid: false, error: 'Must be a valid hex string (0x...)' };
    }
    // Check fixed size bytes (e.g., bytes32)
    if (solidityType !== 'bytes') {
      const size = parseInt(solidityType.replace('bytes', ''));
      const expectedLength = size * 2 + 2; // 2 chars per byte + '0x'
      if (value.length !== expectedLength) {
        return { valid: false, error: `Must be exactly ${size} bytes (${expectedLength} characters including 0x)` };
      }
    }
    return { valid: true };
  }

  // String - always valid
  if (solidityType === 'string') {
    return { valid: true };
  }

  return { valid: true }; // Default: accept
}

/**
 * Validate array input (expects JSON format)
 */
function validateArrayInput(value: any, solidityType: string): { valid: boolean; error?: string } {
  try {
    // If already an array, validate it
    const arr = typeof value === 'string' ? JSON.parse(value) : value;
    
    if (!Array.isArray(arr)) {
      return { valid: false, error: 'Must be a valid JSON array' };
    }

    // Check fixed-size array
    const fixedSize = getFixedArraySize(solidityType);
    if (fixedSize !== null && arr.length !== fixedSize) {
      return { valid: false, error: `Array must have exactly ${fixedSize} elements` };
    }

    // Get base type and validate each element
    const baseType = getBaseType(solidityType);
    for (let i = 0; i < arr.length; i++) {
      const elementValidation = validateInput(arr[i], baseType);
      if (!elementValidation.valid) {
        return { 
          valid: false, 
          error: `Element ${i}: ${elementValidation.error}` 
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format. Expected: ["item1", "item2"]' };
  }
}

/**
 * Validate struct input (expects object with all required fields)
 */
function validateStructInput(value: any, param: AbiParameter): { valid: boolean; error?: string } {
  try {
    const obj = typeof value === 'string' ? JSON.parse(value) : value;
    
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return { valid: false, error: 'Must be a valid object' };
    }

    // Validate each component
    if (param.components) {
      for (const component of param.components) {
        if (!(component.name in obj)) {
          return { valid: false, error: `Missing required field: ${component.name}` };
        }
        
        const fieldValidation = validateInput(obj[component.name], component.type, component);
        if (!fieldValidation.valid) {
          return { 
            valid: false, 
            error: `Field '${component.name}': ${fieldValidation.error}` 
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid struct format. Expected: {"field1": value1, "field2": value2}' };
  }
}

/**
 * Format parameter type for display
 * Enhanced to show struct names and handle complex types
 */
export function formatParameterType(type: string, param?: AbiParameter): string {
  // Show struct name if available
  if (param && isStructType(param) && param.internalType) {
    // Extract struct name from internalType (e.g., "struct MyContract.Token" -> "Token")
    const match = param.internalType.match(/struct\s+(?:\w+\.)?(\w+)/);
    if (match) {
      return match[1];
    }
  }

  // Simplify common types for display
  return type
    .replace(/^uint256$/, 'number')
    .replace(/^int256$/, 'number')
    .replace(/^bytes32$/, 'bytes32')
    .replace(/^address$/, 'address')
    .replace(/^bool$/, 'boolean');
}

/**
 * Get placeholder text for input based on type
 * Enhanced with better examples for all types
 */
export function getPlaceholder(param: AbiParameter): string {
  const { name, type } = param;
  
  // Struct placeholder
  if (isStructType(param)) {
    const fields = param.components?.map(c => `"${c.name}": ...`).join(', ') || '';
    return `{ ${fields} }`;
  }

  // Array placeholders
  if (isArrayType(type)) {
    const baseType = getBaseType(type);
    if (baseType === 'address') return '["0x...", "0x..."]';
    if (baseType.startsWith('uint') || baseType.startsWith('int')) return '[1, 2, 3]';
    if (baseType === 'string') return '["item1", "item2"]';
    return '["item1", "item2"]';
  }

  // Basic type placeholders
  if (type === 'address') return '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  if (type.startsWith('uint') || type.startsWith('int')) return '0';
  if (type === 'bool') return 'true';
  if (type === 'string') return `Enter ${name}`;
  if (type === 'bytes32') return '0x0000000000000000000000000000000000000000000000000000000000000000';
  if (type.startsWith('bytes')) return '0x';
  
  return `Enter ${name}`;
}

/**
 * Format output value for display
 * Handles BigNumber, structs, arrays, and basic types
 */
export function formatOutputValue(value: any, param?: AbiParameter): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'null';
  }

  // Handle BigNumber (from ethers.js)
  if (value._isBigNumber || (value.constructor && value.constructor.name === 'BigNumber')) {
    return value.toString();
  }

  // Handle struct/tuple (will be an array or object)
  if (param && isStructType(param) && param.components) {
    if (Array.isArray(value)) {
      // Tuple returned as array - map to component names
      const obj: Record<string, any> = {};
      param.components.forEach((comp, idx) => {
        obj[comp.name] = formatOutputValue(value[idx], comp);
      });
      return JSON.stringify(obj, null, 2);
    } else if (typeof value === 'object') {
      // Already an object
      return JSON.stringify(value, null, 2);
    }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(v => formatOutputValue(v)), null, 2);
  }

  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return value.toString();
  }

  // Default: convert to string
  return String(value);
}

/**
 * Parse user input for sending to contract
 * Handles JSON arrays, booleans, and type conversion
 */
export function parseInputValue(value: any, solidityType: string, param?: AbiParameter): any {
  // Handle empty
  if (value === '') return '';

  // Handle struct
  if (param && isStructType(param)) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  // Handle arrays
  if (isArrayType(solidityType)) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  // Handle boolean
  if (solidityType === 'bool') {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  }

  // Numbers - keep as string for BigNumber compatibility
  if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
    return value.toString();
  }

  return value;
}

/**
 * Generate human-readable function signature
 * e.g., "transfer(address to, uint256 amount)"
 */
export function getFunctionSignature(func: AbiFunction): string {
  const params = func.inputs
    .map(input => `${formatParameterType(input.type, input)} ${input.name}`)
    .join(', ');
  return `${func.name}(${params})`;
}

/**
 * Check if a function requires ETH payment
 */
export function isPayableFunction(func: AbiFunction): boolean {
  return func.stateMutability === 'payable';
}