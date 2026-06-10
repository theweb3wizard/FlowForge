'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepProgressCard } from '@/components/execution/StepProgressCard';
import { ExecutionSummary } from '@/components/execution/ExecutionSummary';
import { useRecipeExecution } from '@/hooks/useRecipeExecution';
import { Square } from 'lucide-react';
import type { SupportedChain } from '@/types/chain';
import type { RecipeWithSteps } from '@/types/recipe';

function useResumeFrom(): number | undefined {
  const searchParams = useSearchParams();
  const val = searchParams?.get('resumeFrom');
  return val ? Number.parseInt(val, 10) : undefined;
}

type ExecutionProgressInnerProps = {
  recipe: RecipeWithSteps;
  chain: SupportedChain;
};

function ExecutionProgressInner({ recipe, chain }: ExecutionProgressInnerProps) {
  const resumeFrom = useResumeFrom();

  const {
    executeRecipe,
    cancelExecution,
    isRunning,
    stepStatuses,
    completedResults,
    executionStatus,
    error,
  } = useRecipeExecution(recipe, chain, resumeFrom);

  // Kick off execution immediately on mount + cleanup on unmount
  useEffect(() => {
    void executeRecipe();
    return () => { cancelExecution(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSteps = [...recipe.steps].sort(
    (a, b) => a.stepOrder - b.stepOrder,
  );

  const isFinished =
    executionStatus === 'success' ||
    executionStatus === 'partial' ||
    executionStatus === 'failed';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{recipe.name}</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {chain.name}
        </Badge>
        {isRunning && (
          <>
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-400 text-xs"
            >
              Running…
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
              onClick={cancelExecution}
            >
              <Square className="h-3 w-3" />
              Cancel
            </Button>
          </>
        )}
        {executionStatus === 'success' && (
          <Badge
            variant="outline"
            className="border-green-500/40 text-green-400 text-xs"
          >
            Complete
          </Badge>
        )}
        {(executionStatus === 'partial' || executionStatus === 'failed') && (
          <Badge
            variant="outline"
            className="border-red-500/40 text-red-400 text-xs"
          >
            {executionStatus === 'partial' ? 'Partial' : 'Failed'}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {sortedSteps.map((step) => {
          const status = stepStatuses[step.stepOrder] ?? 'pending';
          const result =
            completedResults.find((r) => r.stepOrder === step.stepOrder) ?? null;

          return (
            <StepProgressCard
              key={step.id}
              step={step}
              result={result}
              status={status}
              chain={chain}
            />
          );
        })}
      </div>

      {isFinished && (
        <ExecutionSummary
          executionStatus={executionStatus}
          completedResults={completedResults}
          recipeId={recipe.id}
          error={error}
          chainId={chain.id}
        />
      )}
    </div>
  );
}

type ExecutionProgressProps = {
  recipe: RecipeWithSteps;
  chain: SupportedChain;
};

export function ExecutionProgress(props: ExecutionProgressProps) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading execution...</div>}>
      <ExecutionProgressInner {...props} />
    </Suspense>
  );
}
