'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { detectNetwork, getNetworkMetadata, getExplorerUrlByChainId } from '@/lib/web3/network';
import { NetworkConfig } from '@/types/network';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle, ExternalLink, Network } from 'lucide-react';
import { Button } from '../ui/button';

export function NetworkIndicator() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  
  const [network, setNetwork] = useState<NetworkConfig | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkNetwork() {
      setLoading(true);
      
      if (!isConnected || !chainId) {
        setError('Wallet not connected');
        setNetwork(null);
        setIsCorrect(false);
        setLoading(false);
        return;
      }

      // Use wagmi's chain data directly instead of ethers provider
      const { getNetworkMetadata, KNOWN_CHAINS } = await import('@/lib/web3/network');
      
      // Check if it's a known chain
      const knownChain = KNOWN_CHAINS[chainId];
      
      if (knownChain) {
        // Create config from wagmi chain
        const networkConfig = {
          chainId: knownChain.id,
          name: knownChain.name,
          type: knownChain.name.toLowerCase().replace(/\s+/g, '-'),
          rpcUrl: knownChain.rpcUrls.default.http[0] || '',
          explorerUrl: knownChain.blockExplorers?.default.url || '',
          symbol: knownChain.nativeCurrency.symbol,
          isSupported: true,
        };
        
        setNetwork(networkConfig);
        setIsCorrect(true);
        setError(null);
      } else {
        // Unknown network - create minimal config
        const networkConfig = {
          chainId: chainId,
          name: `Chain ${chainId}`,
          type: `chain-${chainId}`,
          rpcUrl: '',
          explorerUrl: '',
          symbol: '',
          isSupported: true,
        };
        
        setNetwork(networkConfig);
        setIsCorrect(true);
        setError(null);
      }
      
      setLoading(false);
    }

    checkNetwork();
  }, [isConnected, chainId]); // Re-run when chainId changes (instant detection!)

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!isConnected) {
    return (
      <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Network className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          Connect your wallet to get started
        </AlertDescription>
      </Alert>
    );
  }

  if (isCorrect && network) {
    const metadata = getNetworkMetadata(network.chainId);
    const explorerUrl = getExplorerUrlByChainId(network.chainId);
    
    return (
      <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <div className="flex items-start gap-3 w-full">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <AlertDescription className="text-green-800 dark:text-green-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl" role="img" aria-label="network icon">
                  {metadata.icon}
                </span>
                <span>
                  Connected to <strong>{network.name}</strong>
                </span>
                {metadata.isTestnet && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Testnet
                  </span>
                )}
                {metadata.networkType !== 'Unknown' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {metadata.networkType}
                  </span>
                )}
              </div>
            </AlertDescription>
            
            <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-400">
              {network.symbol && (
                <span className="font-medium">
                  Currency: {network.symbol}
                </span>
              )}
              {explorerUrl !== '#' && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Block Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            
            <div className="text-sm text-green-700 dark:text-green-400 font-medium">
              ✓ Ready to deploy contracts
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  // Error or unsupported network
  const canSwitchNetwork = chains && chains.length > 0;
  
  return (
    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
      <div className="flex items-start gap-3 w-full">
        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <AlertDescription>
            {error || 'Network not supported for deployment'}
          </AlertDescription>
          
          {canSwitchNetwork && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Switch to:</span>
              {chains.slice(0, 4).map((chain) => (
                <Button
                  key={chain.id}
                  variant="outline"
                  size="sm"
                  onClick={() => switchChain({ chainId: chain.id })}
                  className="h-7 text-xs bg-white dark:bg-gray-800"
                >
                  {chain.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}