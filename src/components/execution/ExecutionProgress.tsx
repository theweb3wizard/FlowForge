'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { StepProgressCard } from '@/components/execution/StepProgressCard';
import { ExecutionSummary } from '@/components/execution/ExecutionSummary';
import { useRecipeExecution } from '@/hooks/useRecipeExecution';
import type { SupportedChain } from '@/types/chain';
import type { RecipeWithSteps } from '@/types/recipe';

type ExecutionProgressProps = {
  recipe: RecipeWithSteps;
  chain: SupportedChain;
};

export function ExecutionProgress({ recipe, chain }: ExecutionProgressProps) {
  const {
    executeRecipe,
    isRunning,
    stepStatuses,
    completedResults,
    executionStatus,
    error,
  } = useRecipeExecution(recipe, chain);

  // Kick off execution immediately on mount
  useEffect(() => {
    void executeRecipe();
    // Intentionally run once on mount only
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
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{recipe.name}</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {chain.name}
        </Badge>
        {isRunning && (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 text-xs"
          >
            Running…
          </Badge>
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

      {/* Step cards */}
      <div className="space-y-2">
        {sortedSteps.map((step) => {
          const status = stepStatuses[step.stepOrder] ?? 'pending';
          const result =
            completedResults.find((r) => r.stepOrder === step.stepOrder) ??
            null;

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

      {/* Summary (shown when finished) */}
      {isFinished && (
        <ExecutionSummary
          executionStatus={executionStatus}
          completedResults={completedResults}
          recipeId={recipe.id}
          error={error}
        />
      )}
    </div>
  );
}
