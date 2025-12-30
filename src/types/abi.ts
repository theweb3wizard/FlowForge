/**
 * Ethereum ABI types
 * Enhanced to support complex contract interactions including structs, tuples, and events
 */

/**
 * Represents a single function in a contract ABI
 */
export interface AbiFunction {
  name: string;
  type: 'function' | 'constructor';
  inputs: AbiParameter[];
  outputs?: AbiParameter[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

/**
 * Represents a parameter in a function signature
 * Supports nested structures via the components property (for tuples/structs)
 */
export interface AbiParameter {
  name: string;
  type: string;
  internalType?: string;
  components?: AbiParameter[]; // For tuples/structs - enables recursive parsing
  indexed?: boolean; // For event parameters
}

/**
 * Represents an event in a contract ABI
 */
export interface AbiEvent {
  name: string;
  type: 'event';
  inputs: AbiParameter[];
  anonymous?: boolean;
}

/**
 * Represents an error in a contract ABI (for custom errors)
 */
export interface AbiError {
  name: string;
  type: 'error';
  inputs: AbiParameter[];
}

/**
 * Union type for all ABI items
 */
export type AbiItem = AbiFunction | AbiEvent | AbiError;

/**
 * Parsed constructor for form generation
 */
export interface ParsedConstructor {
  inputs: AbiParameter[];
  hasConstructor: boolean;
}

/**
 * Categorized functions for UI rendering
 */
export interface CategorizedFunctions {
  readFunctions: AbiFunction[];
  writeFunctions: AbiFunction[];
}

/**
 * Decoded event log entry
 */
export interface DecodedEvent {
  eventName: string;
  args: Record<string, any>;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
}

/**
 * Transaction state for UI feedback
 */
export type TransactionStatus = 
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'success'
  | 'error';

/**
 * Helper type: Extract the base type from an array type
 * e.g., "uint256[]" -> "uint256"
 */
export type BaseType<T extends string> = T extends `${infer U}[]` ? U : T;

/**
 * Helper type: Check if a type is an array
 */
export type IsArrayType<T extends string> = T extends `${string}[]` ? true : false;

/**
 * Helper type: Check if a parameter is a struct/tuple
 */
export type IsComplexType = (param: AbiParameter) => boolean;