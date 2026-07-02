'use server';

import { auth } from '@/lib/auth/server';
import { getRecipeById, updateRecipe, createRecipe } from '@/lib/db/recipes';
import { upsertSteps, getStepsByRecipe } from '@/lib/db/recipeSteps';
import { db } from '@/lib/db/index';
import { recipes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateRecipePayload, UpsertStepPayload } from '@/types/recipe';

export async function saveRecipeAction(
  recipeId: string,
  meta: UpdateRecipePayload,
  steps: UpsertStepPayload[],
): Promise<{ success: boolean; error?: string }> {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'You must be signed in to save a recipe.' };
  }

  const { data: recipe, error: fetchError } = await getRecipeById(recipeId);

  if (fetchError || !recipe) {
    return { success: false, error: 'Recipe not found.' };
  }

  if (recipe.userId !== session.user.id) {
    return { success: false, error: 'You do not have permission to edit this recipe.' };
  }

  const { error: metaError } = await updateRecipe(recipeId, meta);

  if (metaError) {
    return { success: false, error: metaError };
  }

  if (steps.length > 0) {
    const { error: stepsError } = await upsertSteps(steps);
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
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'You must be signed in.' };
  }

  const { data: recipe } = await getRecipeById(recipeId);

  if (!recipe || recipe.userId !== session.user.id) {
    return { success: false, error: 'Recipe not found.' };
  }

  const { error } = await updateRecipe(recipeId, { isPublic });

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

export async function cloneRecipeAction(
  sourceRecipeId: string,
): Promise<{ success: boolean; newRecipeId?: string; error?: string }> {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'You must be signed in to copy a recipe.' };
  }

  const { data: sourceRecipe } = await getRecipeById(sourceRecipeId);

  if (!sourceRecipe) {
    return { success: false, error: 'Source recipe not found.' };
  }

  const { data: sourceSteps } = await getStepsByRecipe(sourceRecipeId);

  const { data: newRecipe, error: createError } = await createRecipe(session.user.id, {
    name: `Copy of ${sourceRecipe.name}`,
    description: sourceRecipe.description ?? undefined,
  });

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

    const { error: stepsError } = await upsertSteps(clonedSteps);
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
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'You must be signed in.' };
  }

  const { data: recipe, error: createError } = await createRecipe(session.user.id, {
    name,
    description: 'Created from Playground',
  });

  if (createError || !recipe) {
    return { success: false, error: createError ?? 'Failed to create recipe.' };
  }

  try {
    await db.update(recipes).set({ sourceCode }).where(eq(recipes.id, recipe.id));
  } catch (e) {
    console.error('Failed to save source code:', e);
  }

  if (bytecode && abi.length > 0) {
    const steps: UpsertStepPayload[] = [
      {
        recipeId: recipe.id,
        stepOrder: 0,
        stepType: 'deploy',
        label: name,
        contractName: name,
        abi: abi as any,
        bytecode,
        targetAddress: null,
        functionName: null,
        constructorParams: [],
      },
    ];

    const { error: stepsError } = await upsertSteps(steps);
    if (stepsError) {
      return { success: false, error: stepsError };
    }
  }

  return { success: true, recipeId: recipe.id };
}
