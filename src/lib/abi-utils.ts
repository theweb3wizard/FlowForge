import type { Abi, AbiFunction } from 'viem';

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
