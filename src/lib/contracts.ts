import { type Abi, type Hex } from 'viem';

type Parameter = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'address';
  placeholder: string;
};

export type ContractTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  parameters: Parameter[];
  abi: Abi;
  bytecode: Hex;
  status: 'live' | 'soon' | 'draft' | 'deprecated';
};
