import { db } from './index';
import { recipes, recipeSteps } from './schema';
import { eq, inArray } from 'drizzle-orm';
import type { CreateRecipePayload, Recipe, RecipeWithSteps, UpdateRecipePayload } from '@/types/recipe';
import type { ParsedAbi } from '@/types/abi';
import type { StepParamConfig, RecipeStep } from '@/types/recipe';

function parseStepParams(value: unknown): StepParamConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is StepParamConfig =>
      typeof item === 'object' && item !== null && 'name' in item && 'type' in item && 'value' in item && 'isVariable' in item,
  );
}

function mapRecipeRow(row: typeof recipes.$inferSelect): Recipe {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? ''),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? ''),
  };
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



export async function getRecipesByUser(userId: string): Promise<{ data: Recipe[] | null; error: string | null }> {
  try {
    const rows = await db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(recipes.updatedAt);
    return { data: rows.map(mapRecipeRow), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getRecipesByUser:', msg);
    return { data: null, error: msg };
  }
}

export async function getRecipeById(recipeId: string): Promise<{ data: Recipe | null; error: string | null }> {
  if (!recipeId) return { data: null, error: 'Recipe not found' };
  try {
    const [row] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
    if (!row) return { data: null, error: 'Recipe not found' };
    return { data: mapRecipeRow(row), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getRecipeById:', msg);
    return { data: null, error: msg };
  }
}

export async function getRecipeWithSteps(recipeId: string): Promise<{ data: RecipeWithSteps | null; error: string | null }> {
  if (!recipeId) return { data: null, error: 'Recipe not found' };
  try {
    const [row] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
    if (!row) return { data: null, error: 'Recipe not found' };
    const steps = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, recipeId)).orderBy(recipeSteps.stepOrder);
    return {
      data: { ...mapRecipeRow(row), steps: steps.map(mapRecipeStepRow) },
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getRecipeWithSteps:', msg);
    return { data: null, error: msg };
  }
}

export async function createRecipe(userId: string, payload: CreateRecipePayload): Promise<{ data: Recipe | null; error: string | null }> {
  try {
    const [row] = await db
      .insert(recipes)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: payload.name,
        description: payload.description ?? null,
      })
      .returning();
    return { data: mapRecipeRow(row), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('createRecipe:', msg);
    return { data: null, error: msg };
  }
}

export async function updateRecipe(recipeId: string, payload: UpdateRecipePayload): Promise<{ data: Recipe | null; error: string | null }> {
  if (!recipeId) return { data: null, error: 'Recipe not found' };
  try {
    const [row] = await db
      .update(recipes)
      .set({
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.isPublic !== undefined && { isPublic: payload.isPublic }),
      })
      .where(eq(recipes.id, recipeId))
      .returning();
    if (!row) return { data: null, error: 'Recipe not found' };
    return { data: mapRecipeRow(row), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('updateRecipe:', msg);
    return { data: null, error: msg };
  }
}

export async function getStepCountsForRecipes(recipeList: { id: string }[]): Promise<Record<string, number>> {
  if (recipeList.length === 0) return {};
  try {
    const rows = await db
      .select({ recipeId: recipeSteps.recipeId })
      .from(recipeSteps)
      .where(inArray(recipeSteps.recipeId, recipeList.map((r) => r.id)));
    const grouped: Record<string, number> = {};
    for (const r of rows) {
      grouped[r.recipeId] = (grouped[r.recipeId] ?? 0) + 1;
    }
    return grouped;
  } catch {
    return {};
  }
}

export async function deleteRecipe(recipeId: string): Promise<{ error: string | null }> {
  if (!recipeId) return { error: 'Recipe not found' };
  try {
    await db.delete(recipes).where(eq(recipes.id, recipeId));
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('deleteRecipe:', msg);
    return { error: msg };
  }
}
