'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getDeploymentsByAddress } from '@/lib/supabase/deployments';
import { DeploymentWithTemplate } from '@/types/deployment';
import { DeploymentCard } from './DeploymentCard';
import { Button } from '../ui/button';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { DeploymentCardSkeleton } from '@/components/common/LoadingSkeleton';

export function MyContracts() {
  const { address, isConnected } = useWallet();
  const [deployments, setDeployments] = useState<DeploymentWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyDeployments() {
      if (!address) {
        setLoading(false);
        setDeployments([]);
        return;
      }

      try {
        setLoading(true);
        const data = await getDeploymentsByAddress(address);
        setDeployments(data);
      } catch (err) {
        console.error('Error fetching deployments:', err);
        setError('Failed to load your deployments');
      } finally {
        setLoading(false);
      }
    }

    if (isConnected) {
        fetchMyDeployments();
    } else {
        setLoading(false);
        setDeployments([]);
    }
  }, [address, isConnected]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="text-center py-16 border-dashed border-2 rounded-lg">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Connect Your Wallet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your wallet to see your deployed contracts.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
            <DeploymentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16 border-dashed border-2 border-destructive/50 rounded-lg">
        <h3 className="text-lg font-medium text-destructive">Error Loading Contracts</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Empty state
  if (deployments.length === 0) {
    return (
      <div className="text-center py-16 border-dashed border-2 rounded-lg">
        <h3 className="text-lg font-medium">No Contracts Deployed Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You haven't deployed any contracts from this wallet.
        </p>
        <Link href="/" passHref>
            <Button className="mt-6">Browse Templates</Button>
        </Link>
      </div>
    );
  }

  // Success state with deployments
  return (
    <div className="space-y-6">
      {deployments.map((deployment) => (
        <DeploymentCard
          key={deployment.id}
          deployment={deployment}
          showInteractButton={true}
        />
      ))}
    </div>
  );
}
