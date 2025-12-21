import { NetworkConfig, NetworkDetectionResult, NetworkType } from '@/types/network';

/**
 * Supported network configurations
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  'blockdag-testnet': {
    chainId: parseInt(process.env.NEXT_PUBLIC_BLOCKDAG_CHAIN_ID || '0'),
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
 * Detect current network from wallet provider
 */
export async function detectNetwork(provider: any): Promise<NetworkDetectionResult> {
  try {
    if (!provider) {
      return {
        config: NETWORK_CONFIGS['blockdag-testnet'],
        isCorrectNetwork: false,
        error: 'No wallet provider detected',
      };
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Find matching network config
    const config = Object.values(NETWORK_CONFIGS).find(
      (cfg) => cfg.chainId === chainId
    );

    if (!config) {
      return {
        config: NETWORK_CONFIGS['blockdag-testnet'],
        isCorrectNetwork: false,
        error: `Unsupported network (Chain ID: ${chainId})`,
      };
    }

    if (!config.isSupported) {
      return {
        config,
        isCorrectNetwork: false,
        error: `${config.name} is not yet supported`,
      };
    }

    return {
      config,
      isCorrectNetwork: true,
    };
  } catch (error) {
    return {
      config: NETWORK_CONFIGS['blockdag-testnet'],
      isCorrectNetwork: false,
      error: error instanceof Error ? error.message : 'Network detection failed',
    };
  }
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
export function getNetworkByType(type: NetworkType): NetworkConfig {
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
  if (!config.explorerUrl) return '#';
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(network: NetworkType, address: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config.explorerUrl) return '#';
  return `${config.explorerUrl}/address/${address}`;
}
