'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { detectNetwork } from '@/lib/web3/network';
import { NetworkConfig } from '@/types/network';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function NetworkIndicator() {
  const { provider } = useWallet();
  const [network, setNetwork] = useState<NetworkConfig | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkNetwork() {
      setLoading(true);
      if (!provider) {
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      const result = await detectNetwork(provider);
      setNetwork(result.config);
      setIsCorrect(result.isCorrectNetwork);
      setError(result.error || null);
      setLoading(false);
    }

    checkNetwork();

    // Listen for network changes
    const handleNetworkChange = () => {
      checkNetwork();
    };

    if (provider) {
      provider.on('network', handleNetworkChange);
      return () => {
        provider.off('network', handleNetworkChange);
      };
    }
  }, [provider]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (isCorrect && network) {
     return (
       <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-300">
            Connected to <strong>{network.name}</strong>. You are ready to deploy.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription>
        {error || 'Please switch to BlockDAG Testnet in your wallet to deploy contracts.'}
      </AlertDescription>
    </Alert>
  );
}
