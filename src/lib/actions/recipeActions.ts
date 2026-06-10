'use server';

import { createServerClient } from '@/lib/supabase/server';
import { getRecipeById, updateRecipe, createRecipe } from '@/lib/supabase/recipes';
import { upsertSteps, getStepsByRecipe } from '@/lib/supabase/recipeSteps';
import type { Supabase } from '@/lib/supabase/databaseClient';
import type { UpdateRecipePayload, UpsertStepPayload } from '@/types/recipe';

export async function saveRecipeAction(
  recipeId: string,
  meta: UpdateRecipePayload,
  steps: UpsertStepPayload[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to save a recipe.' };
  }

  const { data: recipe, error: fetchError } = await getRecipeById(
    supabase as Supabase,
    recipeId,
  );

  if (fetchError || !recipe) {
    return { success: false, error: 'Recipe not found.' };
  }

  if (recipe.userId !== user.id) {
    return { success: false, error: 'You do not have permission to edit this recipe.' };
  }

  const { error: metaError } = await updateRecipe(
    supabase as Supabase,
    recipeId,
    meta,
  );

  if (metaError) {
    return { success: false, error: metaError };
  }

  if (steps.length > 0) {
    const { error: stepsError } = await upsertSteps(supabase as Supabase, steps);
    if (stepsError) {
      return { success: false, error: stepsError };
    }
  }

  return { success: true };
}

export async function togglePublicAction(
  recipeId: string,
  isPublic: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in.' };
  }

  const { data: recipe } = await getRecipeById(supabase as Supabase, recipeId);

  if (!recipe || recipe.userId !== user.id) {
    return { success: false, error: 'Recipe not found.' };
  }

  const { error } = await updateRecipe(supabase as Supabase, recipeId, {
    isPublic,
  });

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

export async function cloneRecipeAction(
  sourceRecipeId: string,
): Promise<{ success: boolean; newRecipeId?: string; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to copy a recipe.' };
  }

  const { data: sourceRecipe } = await getRecipeById(
    supabase as Supabase,
    sourceRecipeId,
  );

  if (!sourceRecipe) {
    return { success: false, error: 'Source recipe not found.' };
  }

  const { data: sourceSteps } = await getStepsByRecipe(
    supabase as Supabase,
    sourceRecipeId,
  );

  const { data: newRecipe, error: createError } = await createRecipe(
    supabase as Supabase,
    user.id,
    {
      name: `Copy of ${sourceRecipe.name}`,
      description: sourceRecipe.description ?? undefined,
    },
  );

  if (createError || !newRecipe) {
    return { success: false, error: createError ?? 'Failed to create recipe.' };
  }

  if (sourceSteps && sourceSteps.length > 0) {
    const clonedSteps: UpsertStepPayload[] = sourceSteps.map((step) => ({
      recipeId: newRecipe.id,
      stepOrder: step.stepOrder,
      stepType: step.stepType,
      label: step.label,
      contractName: step.contractName,
      abi: step.abi,
      bytecode: step.bytecode,
      targetAddress: step.targetAddress,
      functionName: step.functionName,
      constructorParams: step.constructorParams,
    }));

    const { error: stepsError } = await upsertSteps(supabase as Supabase, clonedSteps);
    if (stepsError) {
      return { success: false, error: stepsError };
    }
  }

  return { success: true, newRecipeId: newRecipe.id };
}

export async function createRecipeFromPlaygroundAction(
  name: string,
  sourceCode: string,
  abi: unknown[],
  bytecode: string | null,
): Promise<{ success: boolean; recipeId?: string; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in.' };
  }

  const { data: recipe, error: createError } = await createRecipe(
    supabase as Supabase,
    user.id,
    { name, description: 'Created from Playground' },
  );

  if (createError || !recipe) {
    return { success: false, error: createError ?? 'Failed to create recipe.' };
  }

  // Save source code to the recipe
  await supabase
    .from('recipes')
    .update({ source_code: sourceCode })
    .eq('id', recipe.id);

  if (bytecode && abi.length > 0) {
    const steps: UpsertStepPayload[] = [
      {
        recipeId: recipe.id,
        stepOrder: 0,
        stepType: 'deploy',
        label: name,
        contractName: name,
        abi,
        bytecode,
        targetAddress: null,
        functionName: null,
        constructorParams: [],
      },
    ];

    const { error: stepsError } = await upsertSteps(supabase as Supabase, steps);
    if (stepsError) {
      return { success: false, error: stepsError };
    }
  }

  return { success: true, recipeId: recipe.id };
}
