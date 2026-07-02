'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { updateRecipe } from '@/lib/db/recipes';
import { upsertSteps } from '@/lib/db/recipeSteps';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';
import type { RecipeWithSteps, UpsertStepPayload } from '@/types/recipe';
import { BuilderToolbar } from '@/components/builder/BuilderToolbar';
import { StepList } from '@/components/builder/StepList';
import { DeployStepConfig } from '@/components/builder/DeployStepConfig';
import { InteractStepConfig } from '@/components/builder/InteractStepConfig';

type BuilderPageProps = {
  recipe: RecipeWithSteps;
};

export function BuilderPage({ recipe }: BuilderPageProps) {
  const initializeBuilder = useRecipeBuilderStore((s) => s.initializeBuilder);
  const getSelectedStep = useRecipeBuilderStore((s) => s.getSelectedStep);
  const isDirty = useRecipeBuilderStore((s) => s.isDirty);
  const setSaving = useRecipeBuilderStore((s) => s.setSaving);
  const markSaved = useRecipeBuilderStore((s) => s.markSaved);
  const recipeId = useRecipeBuilderStore((s) => s.recipeId);
  const recipeName = useRecipeBuilderStore((s) => s.recipeName);
  const recipeDescription = useRecipeBuilderStore((s) => s.recipeDescription);
  const isPublic = useRecipeBuilderStore((s) => s.isPublic);
  const steps = useRecipeBuilderStore((s) => s.steps);

  // Initialize on mount
  useEffect(() => {
    initializeBuilder(recipe);
  }, [recipe, initializeBuilder]);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const handleSave = useCallback(async () => {
    if (!recipeId) return;

    setSaving(true);

    const { error: metaError } = await updateRecipe(recipeId, {
      name: recipeName,
      description: recipeDescription || undefined,
      isPublic,
    });

    if (metaError) {
      toast.error('Failed to save recipe. Please try again.');
      setSaving(false);
      return;
    }

    const stepPayloads: UpsertStepPayload[] = steps.map((step) => ({
      ...step,
      id: step.id.startsWith('temp_') ? undefined : step.id,
      recipeId: recipeId,
    }));

    if (stepPayloads.length > 0) {
      const { error: stepsError } = await upsertSteps(stepPayloads);
      if (stepsError) {
        toast.error('Failed to save steps. Please try again.');
        setSaving(false);
        return;
      }
    }

    markSaved();
    toast.success('Recipe saved.');
  }, [recipeId, recipeName, recipeDescription, isPublic, steps, setSaving, markSaved]);

  // Auto-save every 30s when dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        void handleSave();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [handleSave]);

  const selectedStep = getSelectedStep();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <BuilderToolbar recipeId={recipe.id} onSave={handleSave} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Step list */}
        <aside className="w-full border-r border-border bg-card p-3 md:w-[280px] md:shrink-0 overflow-hidden flex flex-col">
          <StepList />
        </aside>

        {/* Right panel — Step config */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedStep ? (
            selectedStep.stepType === 'deploy' ? (
              <DeployStepConfig stepId={selectedStep.id} />
            ) : (
              <InteractStepConfig stepId={selectedStep.id} />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium">No step selected</p>
                <p className="text-xs">
                  Select a step from the left panel, or add a new one to get started.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
