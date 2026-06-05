'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChainSelector } from '@/components/execution/ChainSelector';
import { ExecutionProgress } from '@/components/execution/ExecutionProgress';
import type { SupportedChain } from '@/types/chain';
import type { RecipeWithSteps } from '@/types/recipe';

type RunModalProps = {
  recipe: RecipeWithSteps;
};

type Stage = 'chain-selection' | 'execution';

export function RunModal({ recipe }: RunModalProps) {
  const [stage, setStage] = useState<Stage>('chain-selection');
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);

  const sortedSteps = [...recipe.steps].sort(
    (a, b) => a.stepOrder - b.stepOrder,
  );

  if (stage === 'execution' && selectedChain) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <ExecutionProgress recipe={recipe} chain={selectedChain} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recipe/${recipe.id}/builder`} aria-label="Back to builder">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Run Recipe</h1>
          <p className="text-sm text-muted-foreground">{recipe.name}</p>
        </div>
      </div>

      {/* Chain selection */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Select Target Chain</h2>
          <p className="text-xs text-muted-foreground">
            Select the EVM network for this deployment
          </p>
        </div>
        <ChainSelector
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
        />
      </div>

      <Separator />

      {/* Step summary (read-only) */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">
          Steps{' '}
          <span className="text-muted-foreground">({sortedSteps.length})</span>
        </h2>
        {sortedSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This recipe has no steps. Add steps in the builder before running.
          </p>
        ) : (
          <ol className="space-y-2">
            {sortedSteps.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">
                  {step.stepOrder + 1}
                </span>
                <span className="flex-1 truncate font-medium">{step.label}</span>
                <Badge
                  variant="outline"
                  className={
                    step.stepType === 'deploy'
                      ? 'shrink-0 border-blue-500/40 text-blue-400 text-xs'
                      : 'shrink-0 border-amber-500/40 text-amber-400 text-xs'
                  }
                >
                  {step.stepType === 'deploy' ? 'DEPLOY' : 'INTERACT'}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* CTA */}
      <Button
        className="w-full"
        disabled={!selectedChain || sortedSteps.length === 0}
        onClick={() => setStage('execution')}
      >
        {selectedChain
          ? `Confirm & Execute on ${selectedChain.name}`
          : 'Select a chain to continue'}
      </Button>
    </div>
  );
}
