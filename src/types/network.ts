import { NetworkType } from './deployment';

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  type: NetworkType;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
  isSupported: boolean;
}

/**
 * Network detection result
 */
export interface NetworkDetectionResult {
  config: NetworkConfig;
  isCorrectNetwork: boolean;
  error?: string;
}
