
import { NetworkConfig, NetworkDetectionResult, NetworkType } from '@/types/network';
import { Chain } from 'wagmi/chains';
import { mainnet, sepolia, polygon, arbitrum, polygonAmoy, arbitrumSepolia, optimism, optimismSepolia, base, baseSepolia, avalanche, avalancheFuji, bsc, bscTestnet } from 'wagmi/chains';

/**
 * Supported network configurations
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  'blockdag-testnet': {
    chainId: 1043,
    name: 'BlockDAG Testnet',
    type: 'blockdag-testnet',
    rpcUrl: process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL || '',
    explorerUrl: process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL || '',
    symbol: 'BDAG',
    isSupported: true,
  },
  'blockdag-mainnet': {
    chainId: 1, // Replace with actual mainnet chain ID when available
    name: 'BlockDAG Mainnet',
    type: 'blockdag-mainnet',
    rpcUrl: '', // Add when mainnet is live
    explorerUrl: '',
    symbol: 'BDAG',
    isSupported: false, // Enable when mainnet launches
  },
  'local': {
    chainId: 31337,
    name: 'Local Network',
    type: 'local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    symbol: 'ETH',
    isSupported: true,
  },
};

/**
 * Map of known wagmi chains for quick lookup
 */
export const KNOWN_CHAINS: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [polygon.id]: polygon,
  [polygonAmoy.id]: polygonAmoy,
  [arbitrum.id]: arbitrum,
  [arbitrumSepolia.id]: arbitrumSepolia,
  [optimism.id]: optimism,
  [optimismSepolia.id]: optimismSepolia,
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [avalanche.id]: avalanche,
  [avalancheFuji.id]: avalancheFuji,
  [bsc.id]: bsc,
  [bscTestnet.id]: bscTestnet,
};

/**
 * Determine if a network is a testnet based on name or chain ID
 */
function isTestnet(chain: Chain): boolean {
  const testnetKeywords = ['test', 'sepolia', 'goerli', 'holesky', 'amoy', 'fuji', 'mumbai'];
  const name = chain.name.toLowerCase();
  return testnetKeywords.some(keyword => name.includes(keyword)) || chain.testnet === true;
}

/**
 * Get network type (L1, L2, or Sidechain) based on chain
 */
function getNetworkType(chain: Chain): 'L1' | 'L2' | 'Sidechain' | 'Unknown' {
  const l2Networks = ['arbitrum', 'optimism', 'base'];
  const sidechains = ['polygon', 'bsc', 'avalanche'];
  
  const name = chain.name.toLowerCase();
  
  if (l2Networks.some(l2 => name.includes(l2))) return 'L2';
  if (sidechains.some(sc => name.includes(sc))) return 'Sidechain';
  if (name.includes('ethereum') || name.includes('mainnet') || name.includes('sepolia')) return 'L1';
  
  return 'Unknown';
}

/**
 * Get network icon emoji based on chain
 */
export function getNetworkIcon(chainId: number, name: string): string {
  // Custom networks
  if (chainId === 1043) return '💎'; // BlockDAG
  if (chainId === 31337) return '🏠'; // Local
  
  const nameLower = name.toLowerCase();
  
  // Popular networks
  if (nameLower.includes('ethereum') || nameLower.includes('sepolia') || nameLower.includes('goerli')) return '⟠';
  if (nameLower.includes('polygon')) return '🟣';
  if (nameLower.includes('arbitrum')) return '🔵';
  if (nameLower.includes('optimism')) return '🔴';
  if (nameLower.includes('base')) return '🔷';
  if (nameLower.includes('avalanche')) return '🔺';
  if (nameLower.includes('bsc') || nameLower.includes('binance')) return '🟡';
  
  return '⛓️'; // Default chain icon
}

/**
 * Detect current network with enhanced metadata
 */
export async function detectNetwork(provider: ethers.providers.Provider): Promise<NetworkDetectionResult> {
  try {
    if (!provider) {
      return {
        config: null,
        isCorrectNetwork: false,
        error: 'No wallet provider detected',
      };
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // First, attempt to find a matching configuration in NETWORK_CONFIGS
    const customConfig = Object.values(NETWORK_CONFIGS).find(
      (cfg) => cfg.chainId === chainId
    );

    // If a custom configuration is found
    if (customConfig) {
      // Check if it's supported
      if (!customConfig.isSupported) {
        return {
          config: customConfig,
          isCorrectNetwork: false,
          error: `${customConfig.name} is not yet supported`,
        };
      }
      
      // The network is supported
      return {
        config: customConfig,
        isCorrectNetwork: true,
        error: undefined
      };
    }

    // No custom configuration found - check if it's a known wagmi chain
    const knownChain = KNOWN_CHAINS[chainId];
    
    if (knownChain) {
      // Create config from known wagmi chain with full metadata
      const dynamicConfig: NetworkConfig = {
        chainId: knownChain.id,
        name: knownChain.name,
        type: knownChain.name.toLowerCase().replace(/\s+/g, '-') as NetworkType,
        rpcUrl: knownChain.rpcUrls.default.http[0] || '',
        explorerUrl: knownChain.blockExplorers?.default.url || '',
        symbol: knownChain.nativeCurrency.symbol,
        isSupported: true,
      };

      return {
        config: dynamicConfig,
        isCorrectNetwork: true,
        error: undefined
      };
    }

    // Unknown network - create minimal config
    const dynamicConfig: NetworkConfig = {
      chainId: network.chainId,
      name: network.name || `Chain ${chainId}`,
      type: (network.name || `chain-${chainId}`).toLowerCase().replace(/\s+/g, '-') as NetworkType,
      rpcUrl: '',
      explorerUrl: '',
      symbol: '',
      isSupported: true,
    };

    return {
      config: dynamicConfig,
      isCorrectNetwork: true,
      error: undefined
    };

  } catch (error) {
    return {
      config: null,
      isCorrectNetwork: false,
      error: error instanceof Error ? error.message : 'Network detection failed',
    };
  }
}

/**
 * Get enhanced network metadata by chain ID
 */
export function getNetworkMetadata(chainId: number): {
  isTestnet: boolean;
  networkType: 'L1' | 'L2' | 'Sidechain' | 'Unknown';
  icon: string;
} {
  const chain = KNOWN_CHAINS[chainId];
  
  if (!chain) {
    return {
      isTestnet: false,
      networkType: 'Unknown',
      icon: '⛓️',
    };
  }

  return {
    isTestnet: isTestnet(chain),
    networkType: getNetworkType(chain),
    icon: getNetworkIcon(chainId, chain.name),
  };
}

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORK_CONFIGS).find((cfg) => cfg.chainId === chainId);
}

/**
 * Get network config by type
 */
export function getNetworkByType(type: NetworkType): NetworkConfig | undefined {
  return NETWORK_CONFIGS[type];
}

/**
 * Format network name for display
 */
export function formatNetworkName(network: NetworkType): string {
  const config = NETWORK_CONFIGS[network];
  return config?.name || network;
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerTxUrl(network: NetworkType, txHash: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config?.explorerUrl) return '#';
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(network: NetworkType, address: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config?.explorerUrl) return '#';
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Get explorer URL by chain ID (for dynamic networks)
 */
export function getExplorerUrlByChainId(chainId: number): string {
  const chain = KNOWN_CHAINS[chainId];
  return chain?.blockExplorers?.default.url || '#';
}

/**
 * Get explorer transaction URL by chain ID
 */
export function getExplorerTxUrlByChainId(chainId: number, txHash: string): string {
  const explorerUrl = getExplorerUrlByChainId(chainId);
  if (explorerUrl === '#') return '#';
  return `${explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer address URL by chain ID
 */
export function getExplorerAddressUrlByChainId(chainId: number, address: string): string {
  const explorerUrl = getExplorerUrlByChainId(chainId);
  if (explorerUrl === '#') return '#';
  return `${explorerUrl}/address/${address}`;
}