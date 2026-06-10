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
  cancelExecution: () => void;
  isRunning: boolean;
  currentStepOrder: number | null;
  stepStatuses: Record<number, StepStatus>;
  completedResults: StepResult[];
  executionStatus: ExecutionStatus;
  executionId: string | null;
  error: string | null;
};

const TX_TIMEOUT_MS = 120_000;

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

// Race an async operation against an abort signal
function withAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  timeoutMs?: number,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Execution cancelled', 'AbortError'));
        return;
      }
      const onAbort = () => reject(new DOMException('Execution cancelled', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });

      if (timeoutMs) {
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', onAbort);
          reject(new Error(`Timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
        // Clean up timer if the promise wins the race
        promise.finally(() => clearTimeout(timer));
      }
    }),
  ]);
}

export function useRecipeExecution(
  recipe: RecipeWithSteps,
  chain: SupportedChain,
  resumeFrom?: number,
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
  const disconnectHaltedRef = useRef(false);
  const executionIdRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      cancelledRef.current = true;
    }
  }, []);

  const safeSetState = useCallback(<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (mountedRef.current) setter(value);
  }, []);

  // Wallet disconnect detection during execution.
  useEffect(() => {
    if (!isRunningRef.current) return;
    if (isConnected) return;
    if (disconnectHaltedRef.current) return;

    disconnectHaltedRef.current = true;
    const execId = executionIdRef.current;

    abortControllerRef.current?.abort();
    cancelledRef.current = true;

    safeSetState(setIsRunning, false);
    isRunningRef.current = false;
    safeSetState(setExecutionStatus, resultsRef.current.length > 0 ? 'partial' : 'failed');
    safeSetState(setError, 'Wallet was disconnected. Execution stopped.');
    safeSetState(setCurrentStepOrder, null);

    if (execId) {
      const supabase = createClient();
      void finalizeExecution(
        supabase,
        execId,
        resultsRef.current.length > 0 ? 'partial' : 'failed',
      );
    }
  }, [isConnected, safeSetState]);

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
        if (persistError.includes('session') || persistError.includes('auth') || persistError.includes('JWT')) {
          console.warn('Auth session expired during execution — continuing without persistence');
          return;
        }
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

      if (mountedRef.current) {
        setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'failed' }));
      }
      resultsRef.current = [...resultsRef.current, failedResult];
      if (mountedRef.current) setCompletedResults(resultsRef.current);

      await persistStepResult(execId, failedResult);

      const supabase = createClient();
      await finalizeExecution(supabase, execId, finalStatus);

      if (mountedRef.current) {
        setExecutionStatus(finalStatus);
        setError(message);
        setIsRunning(false);
        setCurrentStepOrder(null);
      }
      isRunningRef.current = false;
    },
    [persistStepResult],
  );

  const executeRecipe = useCallback(async () => {
    // Re-entrancy guard
    if (isRunningRef.current) {
      console.warn('[useRecipeExecution] executeRecipe called while already running — ignored');
      return;
    }

    if (!isConnected || !address) {
      if (mountedRef.current) setError('Connect your wallet before running this recipe.');
      return;
    }

    abortControllerRef.current = new AbortController();
    cancelledRef.current = false;
    disconnectHaltedRef.current = false;

    if (mountedRef.current) {
      setError(null);
      setIsRunning(true);
    }
    isRunningRef.current = true;
    if (mountedRef.current) setExecutionStatus('running');

    // Partial resume: load prior successful results
    const effectiveResumeFrom = resumeFrom ?? 0;
    let initialResults: StepResult[] = [];
    if (effectiveResumeFrom > 0) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existingExecutions } = await supabase
            .from('executions')
            .select('*')
            .eq('recipe_id', recipe.id)
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(1);

          if (existingExecutions?.[0]?.step_results) {
            initialResults = existingExecutions[0].step_results.filter(
              (r: StepResult) => r.stepOrder < effectiveResumeFrom && r.status === 'success',
            );
          }
        }
      } catch (err) {
        console.warn('[useRecipeExecution] Failed to load prior results for resume:', err);
        // Non-fatal: start from scratch
      }
    }

    if (mountedRef.current) {
      setCompletedResults(initialResults);
    }
    resultsRef.current = initialResults;

    const initialStatuses: Record<number, StepStatus> = {};
    for (const r of initialResults) {
      initialStatuses[r.stepOrder] = r.status;
    }
    if (mountedRef.current) setStepStatuses(initialStatuses);

    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (mountedRef.current) {
        setError('You must be signed in to run a recipe.');
        setIsRunning(false);
        setExecutionStatus('failed');
      }
      isRunningRef.current = false;
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
      if (mountedRef.current) {
        setError(createError ?? 'Failed to start execution.');
        setIsRunning(false);
        setExecutionStatus('failed');
      }
      isRunningRef.current = false;
      return;
    }

    if (mountedRef.current) setExecutionId(execution.id);
    executionIdRef.current = execution.id;

    try {
      await withAbort(switchChainAsync({ chainId: chain.id }), abortControllerRef.current!.signal);
    } catch (switchError: any) {
      if (switchError instanceof DOMException && switchError.name === 'AbortError') return;
      console.error('Chain switch failed:', switchError);
      if (mountedRef.current) {
        setError('Failed to switch to the selected network.');
        setIsRunning(false);
        setExecutionStatus('failed');
      }
      await finalizeExecution(supabase, execution.id, 'failed');
      isRunningRef.current = false;
      return;
    }

    const sortedSteps = [...recipe.steps].sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );

    for (const step of sortedSteps) {
      if (cancelledRef.current || abortControllerRef.current!.signal.aborted) {
        const finalStatus = resultsRef.current.length > 0 ? 'partial' : 'failed';
        await finalizeExecution(supabase, execution.id, finalStatus);
        if (mountedRef.current) {
          setExecutionStatus(finalStatus);
          setError('Execution cancelled.');
          setIsRunning(false);
          setCurrentStepOrder(null);
        }
        isRunningRef.current = false;
        return;
      }

      // Skip already-completed steps (partial resume)
      if (resultsRef.current.find((r) => r.stepOrder === step.stepOrder && r.status === 'success')) {
        continue;
      }

      if (mountedRef.current) {
        setCurrentStepOrder(step.stepOrder);
        setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'running' }));
      }

      let resolvedParams: Array<{ type: string; value: string }>;
      try {
        resolvedParams = step.constructorParams.map((param) => ({
          type: param.type,
          value: resolveStepParam(param, resultsRef.current),
        }));
      } catch (resolveError) {
        const message = resolveError instanceof Error ? resolveError.message : 'Failed to resolve step parameters.';
        const finalStatus = resultsRef.current.length > 0 ? 'partial' : 'failed';
        await haltExecution(execution.id, step, message, finalStatus);
        return;
      }

      try {
        let stepResult: StepResult;

        if (step.stepType === 'deploy') {
          if (!step.bytecode) {
            throw new Error('Deploy step is missing contract bytecode.');
          }

          const hash = await withAbort(
            deployContractAsync({
              abi: step.abi,
              bytecode: step.bytecode as `0x${string}`,
              args: encodeStepArgs(resolvedParams),
              chainId: chain.id,
            }),
            abortControllerRef.current!.signal,
          );

          const receipt = await withAbort(
            waitForTransactionReceipt(wagmiConfig, { hash, chainId: chain.id }),
            abortControllerRef.current!.signal,
            TX_TIMEOUT_MS,
          );

          stepResult = buildStepResult(step, 'success', {
            txHash: hash,
            contractAddress: receipt.contractAddress ?? null,
          });
        } else {
          if (!step.functionName) throw new Error('Interact step is missing a function name.');
          if (!step.targetAddress) throw new Error('Interact step is missing a target address.');

          const resolvedTarget = resolveTargetAddress(step.targetAddress, resultsRef.current);

          const hash = await withAbort(
            writeContractAsync({
              address: resolvedTarget as `0x${string}`,
              abi: step.abi,
              functionName: step.functionName,
              args: encodeStepArgs(resolvedParams),
              chainId: chain.id,
            }),
            abortControllerRef.current!.signal,
          );

          await withAbort(
            waitForTransactionReceipt(wagmiConfig, { hash, chainId: chain.id }),
            abortControllerRef.current!.signal,
            TX_TIMEOUT_MS,
          );

          stepResult = buildStepResult(step, 'success', {
            txHash: hash,
            contractAddress: null,
          });
        }

        resultsRef.current = [...resultsRef.current, stepResult];
        if (mountedRef.current) setCompletedResults(resultsRef.current);
        if (mountedRef.current) setStepStatuses((prev) => ({ ...prev, [step.stepOrder]: 'success' }));
        await persistStepResult(execution.id, stepResult);
      } catch (stepError: any) {
        if (stepError instanceof DOMException && stepError.name === 'AbortError') {
          // Cancelled — finalize as partial
          const finalStatus = resultsRef.current.length > 0 ? 'partial' : 'failed';
          await finalizeExecution(supabase, execution.id, finalStatus);
          if (mountedRef.current) {
            setExecutionStatus(finalStatus);
            setError('Execution cancelled.');
            setIsRunning(false);
            setCurrentStepOrder(null);
          }
          isRunningRef.current = false;
          return;
        }
        console.error('Step execution failed:', stepError);
        const message = formatExecutionError(stepError);
        const finalStatus = resultsRef.current.length > 0 ? 'partial' : 'failed';
        await haltExecution(execution.id, step, message, finalStatus);
        return;
      }
    }

    await finalizeExecution(supabase, execution.id, 'success');
    if (mountedRef.current) {
      setExecutionStatus('success');
      setIsRunning(false);
      setCurrentStepOrder(null);
    }
    isRunningRef.current = false;
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
    resumeFrom,
    switchChainAsync,
    writeContractAsync,
    safeSetState,
  ]);

  return {
    executeRecipe,
    cancelExecution,
    isRunning,
    currentStepOrder,
    stepStatuses,
    completedResults,
    executionStatus,
    executionId,
    error,
  };
}
