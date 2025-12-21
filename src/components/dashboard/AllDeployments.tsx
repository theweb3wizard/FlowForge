'use client';

import { useState, useEffect } from 'react';
import { getAllDeployments, subscribeToDeployments } from '@/lib/supabase/deployments';
import { DeploymentWithTemplate } from '@/types/deployment';
import { DeploymentCard } from './DeploymentCard';
import { Button } from '../ui/button';
import Link from 'next/link';
import { DeploymentCardSkeleton } from '@/components/common/LoadingSkeleton';

export function AllDeployments() {
  const [deployments, setDeployments] = useState<DeploymentWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeployments() {
      try {
        setLoading(true);
        const data = await getAllDeployments();
        setDeployments(data);
      } catch (err) {
        console.error('Error fetching deployments:', err);
        setError('Failed to load deployments');
      } finally {
        setLoading(false);
      }
    }

    fetchDeployments();

    // Subscribe to real-time updates
    const channel = subscribeToDeployments((payload) => {
      if (payload.eventType === 'INSERT' && payload.new.deployment_status === 'success') {
        // A bit inefficient to refetch all, but good enough for now
        // A better implementation would find the new record and join the template data client-side
        fetchDeployments();
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
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
        <h3 className="text-lg font-medium">No Deployments Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to deploy a contract on FlowForge!
        </p>
        <Link href="/" passHref>
            <Button className="mt-6">Deploy Now</Button>
        </Link>
      </div>
    );
  }

  // Success state with deployments
  return (
    <div className="space-y-6">
      {deployments.map((deployment) => (
        <DeploymentCard key={deployment.id} deployment={deployment} />
      ))}
    </div>
  );
}
