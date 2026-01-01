'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useMyDeployments, useMyDeploymentsCount } from '@/hooks/use-queries';
import { DeploymentCard } from './DeploymentCard';
import { Button } from '../ui/button';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { DeploymentCardSkeleton } from '@/components/common/LoadingSkeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 5;

export function MyContracts() {
  const [page, setPage] = useState(1);
  const { isConnected } = useWallet();

  const { data: deployments = [], isLoading, error } = useMyDeployments(page);
  const { data: totalCount = 0 } = useMyDeploymentsCount();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };


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
  if (isLoading && deployments.length === 0) {
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
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (totalCount === 0) {
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
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(page - 1)} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => handlePageChange(i+1)}>
                    {i + 1}
                    </PaginationLink>
                </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(page + 1)} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
