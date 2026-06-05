'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAccount,
  useDeployContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/config/wagmi';
import { createClient } from '@/lib/supabase/client';
import {
  createExecution,
  finalizeExecution,
  updateExecutionStepResult,
} from '@/lib/supabase/executions';
import type { SupportedChain } from '@/types/chain';
import type {
  ExecutionStatus,
  StepResult,
  StepStatus,
} from '@/types/execution';
import type { RecipeStep, RecipeWithSteps } from '@/types/recipe';
import { encodeStepArgs } from '@/utils/encodeStepArgs';
import { formatExecutionError } from '@/utils/formatExecutionError';
import {
  resolveStepParam,
  resolveTargetAddress,
} from '@/utils/resolveStepParam';

type UseRecipeExecutionReturn = {
  executeRecipe: () => Promise<void>;
  isRunning: boolean;
  currentStepOrder: number | null;
  stepStatuses: Record<number, StepStatus>;
  completedResults: StepResult[];
  executionStatus: ExecutionStatus;
  executionId: string | null;
  error: string | null;
};

function buildStepResult(
  step: RecipeStep,
  status: StepStatus,
  overrides: Partial<StepResult> = {},
): StepResult {
  return {
    stepOrder: step.stepOrder,
    stepLabel: step.label,
    status,
    txHash: null,
    contractAddress: null,
    errorMessage: null,
    completedAt: status === 'success' || status === 'failed'
      ? new Date().toISOString()
      : null,
    ...overrides,
  };
}

export function useRecipeExecution(
  recipe: RecipeWithSteps,
  chain: SupportedChain,
): UseRecipeExecutionReturn {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();
  const { writeContractAsync } = useWriteContract();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepOrder, setCurrentStepOrder] = useState<number | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({});
  const [completedResults, setCompletedResults] = useState<StepResult[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('pending');
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<StepResult[]>([]);
  // Track whether a disconnect-triggered halt has already fired during this run
  const disconnectHaltedRef = useRef(false);
  // Ref to the current execution ID so the disconnect effect can access it
  const executionIdRef = useRef<string | null>(null);
  // Track if execution is currently running (ref for use inside effects)
  const isRunningRef = useRef(false);

  // Wallet disconnect detection during execution.
  // If the user disconnects their wallet mid-run, halt with 'partial' status.
  useEffect(() => {
    if (!isRunningRef.current) return;
    if (isConnected) return;
    if (disconnectHaltedRef.current) return;

    disconnectHaltedRef.current = true;
    const execId = executionIdRef.current;

    setIsRunning(false);
    isRunningRef.current = false;
    setExecutionStatus(resultsRef.current.length > 0 ? 'partial' : 'failed');
    setError('Wallet was disconnected. Execution stopped.');
    setCurrentStepOrder(null);

    if (execId) {
      const supabase = createClient();
      void finalizeExecution(
        supabase,
        execId,
        resultsRef.current.length > 0 ? 'partial' : 'failed',
      );
    }
  }, [isConnected]);

  const persistStepResult = useCallback(
    async (execId: string, stepResult: StepResult) => {
      const supabase = createClient();
      const { error: persistError } = await updateExecutionStepResult(
        supabase,
        execId,
        stepResult,
        resultsRef.current,
      );

      if (persistError) {
        // Supabase persistence is best-effort during execution.
        // Log the error but do NOT halt execution — the UI state is the source of truth
        // while the recipe is running. The user can view partial history from the DB
        // on the history page after the run completes.
        console.error('Failed to persist step result (non-fatal):', persistError);
      }
    },
    [],
  );

  const haltExecution = useCallback(
    async (
      execId: string,
      step: RecipeStep,
      message: string,
      finalStatus: Extract<ExecutionStatus, 'partial' | 'failed'>,
    ) => {
      const failedResult = buildStepResult(step, 'failed', {
        errorMessage: message,
      });

      setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'failed' }));
      resultsRef.current = [...resultsRef.current, failedResult];
      setCompletedResults(resultsRef.current);

      await persistStepResult(execId, failedResult);

      const supabase = createClient();
      await finalizeExecution(supabase, execId, finalStatus);

      setExecutionStatus(finalStatus);
      setError(message);
      setIsRunning(false);
      isRunningRef.current = false;
      setCurrentStepOrder(null);
    },
    [persistStepResult],
  );

  /*
   * NAVIGATION LIMITATION NOTE:
   * If the user navigates away from this page while execution is running,
   * this hook unmounts and all in-progress state is lost. The in-progress
   * execution record remains in Supabase with status 'running', and
   * completed step results up to that point are persisted.
   *
   * On returning, the user can see the partial execution in history and
   * the step results that were saved before navigation.
   *
   * V2 path: Background execution via a service worker that holds the
   * wagmi session and continues the loop independently of page visibility.
   * This requires a persistent signing session, which is outside v1 scope.
   */

  const executeRecipe = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Connect your wallet before running this recipe.');
      return;
    }

    // Reset disconnect guard for this new run
    disconnectHaltedRef.current = false;

    setError(null);
    setIsRunning(true);
    isRunningRef.current = true;
    setExecutionStatus('running');
    setStepStatuses({});
    setCompletedResults([]);
    resultsRef.current = [];

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be signed in to run a recipe.');
      setIsRunning(false);
      setExecutionStatus('failed');
      return;
    }

    const { data: execution, error: createError } = await createExecution(
      supabase,
      user.id,
      {
        recipeId: recipe.id,
        chainId: chain.id,
        chainName: chain.name,
      },
    );

    if (createError || !execution) {
      setError(createError ?? 'Failed to start execution.');
      setIsRunning(false);
      setExecutionStatus('failed');
      return;
    }

    setExecutionId(execution.id);
    executionIdRef.current = execution.id;

    try {
      await switchChainAsync({ chainId: chain.id });
    } catch (switchError) {
      console.error('Chain switch failed:', switchError);
      setError('Failed to switch to the selected network.');
      setIsRunning(false);
      setExecutionStatus('failed');
      await finalizeExecution(supabase, execution.id, 'failed');
      return;
    }

    const sortedSteps = [...recipe.steps].sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );

    for (const step of sortedSteps) {
      setCurrentStepOrder(step.stepOrder);
      setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'running' }));

      let resolvedParams: Array<{ type: string; value: string }>;

      try {
        resolvedParams = step.constructorParams.map((param) => ({
          type: param.type,
          value: resolveStepParam(param, resultsRef.current),
        }));
      } catch (resolveError) {
        const message =
          resolveError instanceof Error
            ? resolveError.message
            : 'Failed to resolve step parameters.';
        const finalStatus =
          resultsRef.current.length > 0 ? 'partial' : 'failed';
        await haltExecution(execution.id, step, message, finalStatus);
        return;
      }

      try {
        let stepResult: StepResult;

        if (step.stepType === 'deploy') {
          if (!step.bytecode) {
            throw new Error('Deploy step is missing contract bytecode.');
          }

          const hash = await deployContractAsync({
            abi: step.abi,
            bytecode: step.bytecode as `0x${string}`,
            args: encodeStepArgs(resolvedParams),
            chainId: chain.id,
          });

          const receipt = await waitForTransactionReceipt(wagmiConfig, {
            hash,
            chainId: chain.id,
          });

          stepResult = buildStepResult(step, 'success', {
            txHash: hash,
            contractAddress: receipt.contractAddress ?? null,
          });
        } else {
          if (!step.functionName) {
            throw new Error('Interact step is missing a function name.');
          }

          if (!step.targetAddress) {
            throw new Error('Interact step is missing a target address.');
          }

          const resolvedTarget = resolveTargetAddress(
            step.targetAddress,
            resultsRef.current,
          );

          const hash = await writeContractAsync({
            address: resolvedTarget as `0x${string}`,
            abi: step.abi,
            functionName: step.functionName,
            args: encodeStepArgs(resolvedParams),
            chainId: chain.id,
          });

          await waitForTransactionReceipt(wagmiConfig, {
            hash,
            chainId: chain.id,
          });

          stepResult = buildStepResult(step, 'success', {
            txHash: hash,
            contractAddress: null,
          });
        }

        resultsRef.current = [...resultsRef.current, stepResult];
        setCompletedResults(resultsRef.current);
        setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'success' }));
        await persistStepResult(execution.id, stepResult);
      } catch (stepError) {
        console.error('Step execution failed:', stepError);
        const message = formatExecutionError(stepError);
        const finalStatus =
          resultsRef.current.length > 0 ? 'partial' : 'failed';
        await haltExecution(execution.id, step, message, finalStatus);
        return;
      }
    }

    await finalizeExecution(supabase, execution.id, 'success');
    setExecutionStatus('success');
    setIsRunning(false);
    isRunningRef.current = false;
    setCurrentStepOrder(null);
  }, [
    address,
    chain.id,
    chain.name,
    deployContractAsync,
    haltExecution,
    isConnected,
    persistStepResult,
    recipe.id,
    recipe.steps,
    switchChainAsync,
    writeContractAsync,
  ]);

  return {
    executeRecipe,
    isRunning,
    currentStepOrder,
    stepStatuses,
    completedResults,
    executionStatus,
    executionId,
    error,
  };
}
