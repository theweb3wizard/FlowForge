'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllDeployments,
  getDeploymentsByAddress,
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

// Hook to fetch all public deployments
export function useAllDeployments() {
  return useQuery({
    queryKey: ['deployments', 'all'],
    queryFn: getAllDeployments,
  });
}

// Hook to fetch deployments for the connected user
export function useMyDeployments() {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['deployments', 'my', address],
    queryFn: () => getDeploymentsByAddress(address!),
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
