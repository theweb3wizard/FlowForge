import { db } from './index';
import { recipeSteps } from './schema';
import { eq, and } from 'drizzle-orm';
import type { ParsedAbi } from '@/types/abi';
import type { RecipeStep, UpsertStepPayload } from '@/types/recipe';
import type { StepParamConfig } from '@/types/recipe';

function parseStepParams(value: unknown): StepParamConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is StepParamConfig =>
      typeof item === 'object' && item !== null && 'name' in item && 'type' in item && 'value' in item && 'isVariable' in item,
  );
}

function mapRecipeStepRow(row: typeof recipeSteps.$inferSelect): RecipeStep {
  return {
    id: row.id,
    recipeId: row.recipeId,
    stepOrder: row.stepOrder,
    stepType: row.stepType,
    label: row.label,
    contractName: row.contractName,
    abi: row.abi as ParsedAbi,
    bytecode: row.bytecode,
    targetAddress: row.targetAddress,
    functionName: row.functionName,
    constructorParams: parseStepParams(row.constructorParams),
  };
}

export async function getStepsByRecipe(recipeId: string): Promise<{ data: RecipeStep[] | null; error: string | null }> {
  try {
    const rows = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, recipeId)).orderBy(recipeSteps.stepOrder);
    return { data: rows.map(mapRecipeStepRow), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getStepsByRecipe:', msg);
    return { data: null, error: msg };
  }
}

export async function upsertSteps(steps: UpsertStepPayload[]): Promise<{ data: RecipeStep[] | null; error: string | null }> {
  if (steps.length === 0) return { data: [], error: null };
  try {
    const mapped: RecipeStep[] = [];
    for (const step of steps) {
      if (!step.id || step.id.startsWith('temp_')) {
        const [row] = await db
          .insert(recipeSteps)
          .values({
            id: crypto.randomUUID(),
            recipeId: step.recipeId,
            stepOrder: step.stepOrder,
            stepType: step.stepType,
            label: step.label,
            contractName: step.contractName ?? null,
            abi: step.abi ?? null,
            bytecode: step.bytecode ?? null,
            targetAddress: step.targetAddress ?? null,
            functionName: step.functionName ?? null,
            constructorParams: step.constructorParams ?? null,
          })
          .returning();
        mapped.push(mapRecipeStepRow(row));
      } else {
        const [row] = await db
          .insert(recipeSteps)
          .values({
            id: step.id,
            recipeId: step.recipeId,
            stepOrder: step.stepOrder,
            stepType: step.stepType,
            label: step.label,
            contractName: step.contractName ?? null,
            abi: step.abi ?? null,
            bytecode: step.bytecode ?? null,
            targetAddress: step.targetAddress ?? null,
            functionName: step.functionName ?? null,
            constructorParams: step.constructorParams ?? null,
          })
          .onConflictDoUpdate({
            target: recipeSteps.id,
            set: {
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              label: step.label,
              contractName: step.contractName ?? null,
              abi: step.abi ?? null,
              bytecode: step.bytecode ?? null,
              targetAddress: step.targetAddress ?? null,
              functionName: step.functionName ?? null,
              constructorParams: step.constructorParams ?? null,
            },
          })
          .returning();
        mapped.push(mapRecipeStepRow(row));
      }
    }
    return { data: mapped.sort((a, b) => a.stepOrder - b.stepOrder), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('upsertSteps:', msg);
    return { data: null, error: msg };
  }
}

export async function deleteStep(stepId: string): Promise<{ error: string | null }> {
  if (!stepId) return { error: 'Step not found' };
  try {
    await db.delete(recipeSteps).where(eq(recipeSteps.id, stepId));
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('deleteStep:', msg);
    return { error: msg };
  }
}

export async function reorderSteps(recipeId: string, orderedStepIds: string[]): Promise<{ error: string | null }> {
  try {
    for (let index = 0; index < orderedStepIds.length; index++) {
      await db
        .update(recipeSteps)
        .set({ stepOrder: index })
        .where(and(eq(recipeSteps.id, orderedStepIds[index]), eq(recipeSteps.recipeId, recipeId)));
    }
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('reorderSteps:', msg);
    return { error: msg };
  }
}
