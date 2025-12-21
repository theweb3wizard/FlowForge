/**
 * Ethereum ABI types
 */
export interface AbiFunction {
  name: string;
  type: 'function' | 'constructor';
  inputs: AbiParameter[];
  outputs?: AbiParameter[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

export interface AbiParameter {
  name: string;
  type: string;
  internalType?: string;
  components?: AbiParameter[]; // For tuples/structs
}

export interface AbiEvent {
  name: string;
  type: 'event';
  inputs: AbiParameter[];
  anonymous?: boolean;
}

export type AbiItem = AbiFunction | AbiEvent;

/**
 * Parsed constructor for form generation
 */
export interface ParsedConstructor {
  inputs: AbiParameter[];
  hasConstructor: boolean;
}
