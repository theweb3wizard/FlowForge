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
  status: 'live' | 'soon';
};

// This is now a placeholder. In a fully data-driven system,
// this array would be fetched from a database (e.g., Supabase).
// For now, we manually include the abi and bytecode for the live contract.
import { erc20Abi, erc20Bytecode } from '@/lib/abis/erc20';

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'erc20',
    name: 'Standard Token (ERC-20)',
    description: 'Create a fungible token with a fixed supply. Perfect for utility tokens, digital currencies, and more.',
    icon: 'Coins',
    parameters: [
      { name: 'name_', label: 'Token Name', type: 'text', placeholder: 'e.g., My Awesome Token' },
      { name: 'symbol_', label: 'Token Symbol', type: 'text', placeholder: 'e.g., MAT' },
      { name: 'initialSupply_', label: 'Initial Supply', type: 'number', placeholder: 'e.g., 1000000' },
    ],
    status: 'live',
    abi: erc20Abi,
    bytecode: erc20Bytecode,
  },
  {
    id: 'vesting',
    name: 'Token Vesting',
    description: 'Lock up tokens for a specified period, releasing them gradually over time. Essential for team and investor allocations.',
    icon: 'Lock',
    parameters: [],
    status: 'soon',
    abi: [],
    bytecode: '0x',
  },
  {
    id: 'governance',
    name: 'Governance DAO',
    description: 'Deploy a simple DAO contract for on-chain voting and proposal execution. Power your community-led project.',
    icon: 'Vote',
    parameters: [],
    status: 'soon',
    abi: [],
    bytecode: '0x',
  },
  {
    id: 'multisig',
    name: 'Multi-Sig Wallet',
    description: 'A secure wallet that requires multiple signatures to approve transactions. Protect your treasury funds.',
    icon: 'ShieldCheck',
    parameters: [ ],
    status: 'soon',
    abi: [],
    bytecode: '0x',
  },
  {
    id: 'simple-marketplace',
    name: 'Simple Marketplace',
    description: 'A basic marketplace contract for listing and selling NFTs (ERC-721) at a fixed price.',
    icon: 'Store',
    parameters: [],
    status: 'soon',
    abi: [],
    bytecode: '0x',
  },
];