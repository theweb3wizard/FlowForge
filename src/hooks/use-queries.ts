'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDeployments,
  getDeploymentsCount,
  getDeploymentsByAddress,
  getMyDeploymentsCount,
  getDeploymentByContractAddress,
  getDeploymentsByExecutionId,
} from '@/lib/supabase/deployments';
import { getActiveTemplates, getTemplateById } from '@/lib/supabase/templates';
import { 
  getRecipes,
  createRecipe,
  deleteRecipe,
  createUserTemplate,
  getUserTemplates,
  deleteUserTemplate,
  getRecipeExecutions,
} from '@/lib/supabase/recipes';
import { useWallet } from '@/contexts/WalletContext';
import { CreateTemplatePayload } from '@/types/template';
import { Recipe, RecipeExecution } from '@/types/recipe';
import { supabase } from '@/lib/supabase';

// Hook to fetch all active public templates AND user-created templates
export function useTemplates() {
  const { address, isConnected } = useWallet();

  return useQuery({
    queryKey: ['templates', address],
    queryFn: async () => {
      const publicTemplates = await getActiveTemplates();
      
      if (isConnected && address) {
        const userTemplates = await getUserTemplates(address);
        // Add a flag to distinguish user templates
        const markedUserTemplates = userTemplates.map(t => ({ ...t, creator_address: address, status: 'active' as const }));
        return [...markedUserTemplates, ...publicTemplates];
      }
      
      return publicTemplates;
    },
    // The query will refetch if the user connects/disconnects
    enabled: true, 
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

// Hook to create a new recipe
export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { address } = useWallet();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: (newRecipe: Recipe | null) => {
      if (newRecipe) {
        queryClient.invalidateQueries({ queryKey: ['recipes', 'my', address] });
      }
    },
  });
}

// Hook to delete a recipe - UPDATED to handle new return type
export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  const { address } = useWallet();

  return useMutation({
    mutationFn: (recipeId: string) => deleteRecipe(recipeId, address!),
    // NEW: Only invalidate on successful deletion
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['recipes', 'my', address] });
      }
      // If result.success is false, the error will be handled in the component's onSuccess callback
    },
  });
}

// Hook to fetch user-created templates
export function useUserTemplates() {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['templates', 'user', address],
    queryFn: () => getUserTemplates(address!),
    enabled: isConnected && !!address,
  });
}

// Hook to create a new user template
export function useCreateUserTemplate() {
    const queryClient = useQueryClient();
    const { address } = useWallet();

    return useMutation({
        mutationFn: (payload: CreateTemplatePayload) => createUserTemplate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates', 'user', address] });
            queryClient.invalidateQueries({ queryKey: ['templates', address] });
        }
    });
}

// Hook to delete a user template
export function useDeleteUserTemplate() {
    const queryClient = useQueryClient();
    const { address } = useWallet();

    return useMutation({
        mutationFn: (templateId: string) => deleteUserTemplate(templateId, address!),
        onSuccess: (result) => {
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ['templates', 'user', address] });
            queryClient.invalidateQueries({ queryKey: ['templates', address] });
          }
        },
    });
}

// Hook to fetch a single recipe execution by ID
export function useRecipeExecution(executionId: string) {
  return useQuery({
    queryKey: ['recipe-execution', executionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error) throw error;
      return data as RecipeExecution;
    },
    enabled: !!executionId,
  });
}

// Hook to fetch deployments created by a specific recipe execution
export function useDeploymentsByExecution(executionId: string) {
  return useQuery({
    queryKey: ['deployments', 'execution', executionId],
    queryFn: () => getDeploymentsByExecutionId(executionId),
    enabled: !!executionId,
  });
}

// Hook to fetch execution history for a specific recipe
export function useRecipeExecutionHistory(recipeId: string) {
  return useQuery({
    queryKey: ['recipe-executions', 'history', recipeId],
    queryFn: () => getRecipeExecutions(recipeId),
    enabled: !!recipeId,
  });
}