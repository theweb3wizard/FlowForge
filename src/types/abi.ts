export type AbiInputParam = {
  name: string;
  type: string;
  internalType?: string;
  components?: AbiInputParam[];
};

export type AbiFunction = {
  type: 'function';
  name: string;
  inputs: AbiInputParam[];
  outputs: AbiInputParam[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
};

export type AbiConstructor = {
  type: 'constructor';
  inputs: AbiInputParam[];
  stateMutability: 'nonpayable' | 'payable';
};

export type AbiEvent = {
  type: 'event';
  name: string;
  inputs: (AbiInputParam & { indexed: boolean })[];
};

export type AbiEntry =
  | AbiFunction
  | AbiConstructor
  | AbiEvent
  | { type: 'fallback' | 'receive' };

export type ParsedAbi = AbiEntry[];
