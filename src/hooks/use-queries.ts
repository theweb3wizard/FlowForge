'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllDeployments,
  getDeploymentsCount,
  getDeploymentsByAddress,
  getMyDeploymentsCount,
  getDeploymentByContractAddress,
} from '@/lib/supabase/deployments';
import { getActiveTemplates, getTemplateById } from '@/lib/supabase/templates';
import { getRecipes } from '@/lib/supabase/recipes';
import { useWallet } from '@/contexts/WalletContext';

// Hook to fetch all active templates
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: getActiveTemplates,
  });
}

// Hook to fetch a single template by ID
export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplateById(id),
    enabled: !!id,
  });
}

// Hook to fetch all public deployments with pagination
export function useAllDeployments(page: number) {
  return useQuery({
    queryKey: ['deployments', 'all', page],
    queryFn: () => getAllDeployments(page),
    placeholderData: (previousData) => previousData,
  });
}

// Hook to fetch total count of public deployments
export function useAllDeploymentsCount() {
    return useQuery({
        queryKey: ['deployments', 'all', 'count'],
        queryFn: getDeploymentsCount,
    });
}

// Hook to fetch deployments for the connected user with pagination
export function useMyDeployments(page: number) {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['deployments', 'my', address, page],
    queryFn: () => getDeploymentsByAddress(address!, page),
    enabled: isConnected && !!address,
    placeholderData: (previousData) => previousData,
  });
}

// Hook to fetch total count of user's deployments
export function useMyDeploymentsCount() {
    const { address, isConnected } = useWallet();
    return useQuery({
        queryKey: ['deployments', 'my', address, 'count'],
        queryFn: () => getMyDeploymentsCount(address!),
        enabled: isConnected && !!address,
    });
}


// Hook to fetch a single deployment by its contract address
export function useDeployment(contractAddress: string) {
  return useQuery({
    queryKey: ['deployment', contractAddress],
    queryFn: () => getDeploymentByContractAddress(contractAddress),
    enabled: !!contractAddress,
  });
}

// Hook to fetch recipes
export function useRecipes(filter: 'my' | 'public' = 'my') {
  const { address } = useWallet();
  const queryKey =
    filter === 'my' ? ['recipes', 'my', address] : ['recipes', 'public'];
  const queryFn =
    filter === 'my'
      ? () => getRecipes(address)
      : () => getRecipes(undefined, true);
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: filter === 'public' || (filter === 'my' && !!address),
  });
}

// NOTE: useStats hook is omitted as StatsPanel.tsx already has complex, aggregated queries.
// Refactoring it would require creating multiple Supabase RPC functions for optimal performance,
// which is outside the scope of this data-fetching upgrade. The current implementation is acceptable.
