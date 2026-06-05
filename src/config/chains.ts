import {
  arbitrum,
  base,
  baseSepolia,
  bsc,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'viem/chains';
import { defineChain, type Chain } from 'viem';
import type { SupportedChain } from '@/types/chain';

export const blockdag = defineChain({
  id: 1043,
  name: 'BlockDAG Mainnet',
  nativeCurrency: {
    name: 'BDAG',
    symbol: 'BDAG',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bdagscan.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BlockDAG Explorer',
      url: 'https://bdagscan.com',
    },
  },
});

export const SUPPORTED_CHAINS = [
  {
    id: mainnet.id,
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    isTestnet: false,
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
    iconUrl: null,
  },
  {
    id: sepolia.id,
    name: 'Sepolia Testnet',
    shortName: 'SEP',
    isTestnet: true,
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerName: 'Etherscan',
    iconUrl: null,
  },
  {
    id: base.id,
    name: 'Base',
    shortName: 'BASE',
    isTestnet: false,
    explorerUrl: 'https://basescan.org',
    explorerName: 'Basescan',
    iconUrl: null,
  },
  {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    shortName: 'BSEP',
    isTestnet: true,
    explorerUrl: 'https://sepolia.basescan.org',
    explorerName: 'Basescan',
    iconUrl: null,
  },
  {
    id: polygon.id,
    name: 'Polygon',
    shortName: 'MATIC',
    isTestnet: false,
    explorerUrl: 'https://polygonscan.com',
    explorerName: 'Polygonscan',
    iconUrl: null,
  },
  {
    id: arbitrum.id,
    name: 'Arbitrum One',
    shortName: 'ARB',
    isTestnet: false,
    explorerUrl: 'https://arbiscan.io',
    explorerName: 'Arbiscan',
    iconUrl: null,
  },
  {
    id: optimism.id,
    name: 'Optimism',
    shortName: 'OP',
    isTestnet: false,
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerName: 'Optimism Explorer',
    iconUrl: null,
  },
  {
    id: bsc.id,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    isTestnet: false,
    explorerUrl: 'https://bscscan.com',
    explorerName: 'BscScan',
    iconUrl: null,
  },
  {
    id: blockdag.id,
    name: 'BlockDAG Mainnet',
    shortName: 'BDAG',
    isTestnet: false,
    explorerUrl: 'https://bdagscan.com',
    explorerName: 'BlockDAG Explorer',
    iconUrl: null,
  },
] as const satisfies readonly SupportedChain[];

export const TESTNET_CHAIN_IDS: number[] = SUPPORTED_CHAINS.filter(
  (chain) => chain.isTestnet,
).map((chain) => chain.id);

export const VIEM_CHAINS: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [bsc.id]: bsc,
  [blockdag.id]: blockdag,
};

export function getChainById(id: number): SupportedChain | undefined {
  return SUPPORTED_CHAINS.find((chain) => chain.id === id);
}

export function getExplorerTxUrl(chain: SupportedChain, txHash: string): string {
  return `${chain.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(
  chain: SupportedChain,
  address: string,
): string {
  return `${chain.explorerUrl}/address/${address}`;
}
