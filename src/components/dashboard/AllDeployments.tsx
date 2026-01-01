'use client';

import { useState, useEffect } from 'react';
import { subscribeToDeployments } from '@/lib/supabase/deployments';
import { useAllDeployments } from '@/hooks/use-queries';
import { DeploymentCard } from './DeploymentCard';
import { Button } from '../ui/button';
import Link from 'next/link';
import { DeploymentCardSkeleton } from '@/components/common/LoadingSkeleton';
import { useQueryClient } from '@tanstack/react-query';

export function AllDeployments() {
  const queryClient = useQueryClient();
  const {
    data: deployments = [],
    isLoading,
    error,
  } = useAllDeployments();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = subscribeToDeployments((payload) => {
      // Refetch on any insert or update to the deployments table
      if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new.deployment_status === 'success') {
        // Invalidate the query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['deployments', 'all'] });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Loading state
  if (isLoading) {
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
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
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
