import { type Icon as LucideIcon } from 'lucide-react';

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
  status: 'live' | 'soon';
};

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'erc20',
    name: 'Standard Token (ERC-20)',
    description: 'Create a fungible token with a fixed supply. Perfect for utility tokens, digital currencies, and more.',
    icon: 'Coins',
    parameters: [
      { name: 'tokenName', label: 'Token Name', type: 'text', placeholder: 'e.g., My Awesome Token' },
      { name: 'tokenSymbol', label: 'Token Symbol', type: 'text', placeholder: 'e.g., MAT' },
      { name: 'initialSupply', label: 'Initial Supply', type: 'number', placeholder: 'e.g., 1000000' },
    ],
    status: 'live',
  },
  {
    id: 'erc721',
    name: 'NFT Collection (ERC-721)',
    description: 'Launch a collection of unique, non-fungible tokens. Ideal for digital art, collectibles, and gaming items.',
    icon: 'GalleryThumbnails',
    parameters: [
      { name: 'collectionName', label: 'Collection Name', type: 'text', placeholder: 'e.g., Cool Cats' },
      { name: 'collectionSymbol', label: 'Collection Symbol', type: 'text', placeholder: 'e.g., CATS' },
    ],
    status: 'soon',
  },
  {
    id: 'vesting',
    name: 'Token Vesting',
    description: 'Lock up tokens for a specified period, releasing them gradually over time. Essential for team and investor allocations.',
    icon: 'Lock',
    parameters: [
      { name: 'beneficiary', label: 'Beneficiary Address', type: 'address', placeholder: '0x...' },
      { name: 'cliffDuration', label: 'Cliff (in days)', type: 'number', placeholder: 'e.g., 365' },
      { name: 'vestingDuration', label: 'Total Vesting (in days)', type: 'number', placeholder: 'e.g., 1460' },
    ],
    status: 'soon',
  },
  {
    id: 'governance',
    name: 'Governance DAO',
    description: 'Deploy a simple DAO contract for on-chain voting and proposal execution. Power your community-led project.',
    icon: 'Vote',
    parameters: [
      { name: 'daoName', label: 'DAO Name', type: 'text', placeholder: 'e.g., FlowForge DAO' },
      { name: 'votingToken', label: 'Voting Token Address', type: 'address', placeholder: '0x... (Your ERC-20 token)' },
      { name: 'quorumPercentage', label: 'Quorum %', type: 'number', placeholder: 'e.g., 4' },
    ],
    status: 'soon',
  },
  {
    id: 'multisig',
    name: 'Multi-Sig Wallet',
    description: 'A secure wallet that requires multiple signatures to approve transactions. Protect your treasury funds.',
    icon: 'ShieldCheck',
    parameters: [
      { name: 'owners', label: 'Owner Addresses (comma-separated)', type: 'text', placeholder: '0x..., 0x..., 0x...' },
      { name: 'requiredSignatures', label: 'Required Signatures', type: 'number', placeholder: 'e.g., 2' },
    ],
    status: 'soon',
  },
  {
    id: 'simple-marketplace',
    name: 'Simple Marketplace',
    description: 'A basic marketplace contract for listing and selling NFTs (ERC-721) at a fixed price.',
    icon: 'Store',
    parameters: [
      { name: 'marketplaceName', label: 'Marketplace Name', type: 'text', placeholder: 'e.g., The Grand Bazaar' },
      { name: 'listingFee', label: 'Listing Fee (%)', type: 'number', placeholder: 'e.g., 2.5' },
    ],
    status: 'soon',
  },
];
