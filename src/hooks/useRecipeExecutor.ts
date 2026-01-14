'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Recipe, StepResult } from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { detectNetwork } from '@/lib/web3/network';
import { NetworkType } from '@/types/deployment';
import { 
  createRecipeExecution, 
  updateRecipeExecution,
  incrementRecipeExecutionCount 
} from '@/lib/supabase/recipes';
import { RecipeExecutor } from '@/lib/recipes/RecipeExecutor';

interface ExecutionState {
  isExecuting: boolean;
  currentStepIndex: number;
  executionId?: string; // NEW: Track the execution ID
}

export function useRecipeExecutor() {
  const { address, provider } = useWallet();
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    currentStepIndex: -1,
  });

  const executeRecipe = useCallback(async (
    recipe: Recipe,
    templates: Map<string, ContractTemplate>,
    onStepComplete: (stepIndex: number, result: StepResult) => void
  ): Promise<string> => { // CHANGED: Now returns execution ID
    if (!address || !provider) {
      throw new Error('Please connect your wallet first');
    }

    setExecutionState({
      isExecuting: true,
      currentStepIndex: 0,
    });

    const networkResult = await detectNetwork(provider);
    if (!networkResult.isCorrectNetwork) {
      throw new Error(networkResult.error || 'Please connect to a supported network');
    }

    const network = networkResult.config.type as NetworkType;
    const chainId = networkResult.config.chainId;
    const signer = provider.getSigner();

    const execution = await createRecipeExecution(recipe.id, address, recipe.steps.length);
    if (!execution) {
      setExecutionState({ isExecuting: false, currentStepIndex: -1 });
      throw new Error('Failed to create execution record in the database');
    }

    // Update state with execution ID
    setExecutionState(prev => ({
      ...prev,
      executionId: execution.id,
    }));

    // CRITICAL CHANGE: Pass execution.id to the executor
    const executor = new RecipeExecutor(
      provider, 
      signer, 
      address, 
      network, 
      chainId,
      execution.id // NEW: Pass execution ID
    );

    try {
      const finalResults = await executor.execute(recipe, templates, (stepIndex, result) => {
        onStepComplete(stepIndex, result);
        setExecutionState(prev => ({ ...prev, currentStepIndex: stepIndex + 1 }));
        
        // Update DB on each step completion
        updateRecipeExecution(execution.id, {
          current_step: stepIndex + 1,
          step_results: (prevResults) => [...(prevResults || []), result],
        });
      });

      // All steps completed successfully
      await updateRecipeExecution(execution.id, {
        status: 'completed',
        current_step: recipe.steps.length,
        completed_at: new Date().toISOString(),
      });
      await incrementRecipeExecutionCount(recipe.id);

      return execution.id; // NEW: Return the execution ID
      
    } catch (error: any) {
      // An error in one of the steps will be thrown by the executor
      console.error(`❌ [Recipe Hook] Execution failed:`, error);
      await updateRecipeExecution(execution.id, {
        status: 'failed',
        error_message: error.message || 'An unknown error occurred during execution.',
        completed_at: new Date().toISOString(),
      });
      // Re-throw to be caught by the UI component
      throw error;
    } finally {
      setExecutionState({ isExecuting: false, currentStepIndex: -1 });
    }
  }, [address, provider]);

  return {
    executeRecipe,
    executionState,
  };
}