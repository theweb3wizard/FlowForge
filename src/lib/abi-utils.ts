import { type Abi, type AbiFunction, type AbiParameter, parseEther } from 'viem';

export interface ParsedAbiFunction {
  name: string;
  type: 'read' | 'write';
  inputs: readonly any[];
  outputs: readonly any[];
  payable: boolean;
}

export function parseContractAbi(abi: Abi): { reads: ParsedAbiFunction[], writes: ParsedAbiFunction[] } {
  const functions = abi.filter(item => item.type === 'function') as AbiFunction[];

  const reads: ParsedAbiFunction[] = functions
    .filter(item => item.stateMutability === 'view' || item.stateMutability === 'pure')
    .map(item => ({
      name: item.name,
      type: 'read',
      inputs: item.inputs,
      outputs: item.outputs,
      payable: false,
    }));

  const writes: ParsedAbiFunction[] = functions
    .filter(item => item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
    .map(item => ({
      name: item.name,
      type: 'write',
      inputs: item.inputs,
      outputs: item.outputs,
      payable: item.stateMutability === 'payable',
    }));

  return { reads, writes };
}

export function formatResult(value: any): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null) {
      // For structs or arrays, pretty-print the JSON
      return JSON.stringify(value, (key, val) =>
        typeof val === 'bigint' ? val.toString() : val, 2);
    }
    return String(value);
  }

// Generic function to process constructor arguments based on their ABI type
export const processConstructorArgs = (values: Record<string, any>, parameters: readonly AbiParameter[]): any[] => {
    return parameters.map(param => {
        const value = values[param.name!];
        if (param.type.includes('uint')) {
            // Attempt to parse as ether if it contains a decimal, otherwise treat as a large integer.
            // This is a common convention for token supplies.
            try {
                if (typeof value === 'string' && value.includes('.')) {
                    return parseEther(value);
                }
                return BigInt(value);
            } catch (e) {
                 console.error(`Error processing uint value for ${param.name}: ${value}`, e);
                 return value; // return original value on error
            }
        }
        return value;
    });
};
