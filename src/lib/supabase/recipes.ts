import type { Database } from '@/lib/supabase/types';
import type { Supabase } from '@/lib/supabase/databaseClient';
import type {
  CreateRecipePayload,
  Recipe,
  RecipeWithSteps,
  UpdateRecipePayload,
} from '@/types/recipe';
import type { ParsedAbi } from '@/types/abi';
import type { StepParamConfig, RecipeStep } from '@/types/recipe';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeStepRow = Database['public']['Tables']['recipe_steps']['Row'];

function formatSupabaseError(message: string): string {
  return message || 'An unexpected database error occurred. Please try again.';
}

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStepParams(value: unknown): StepParamConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is StepParamConfig =>
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      'type' in item &&
      'value' in item &&
      'isVariable' in item,
  );
}

function mapRecipeStepRow(row: RecipeStepRow): RecipeStep {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    stepOrder: row.step_order,
    stepType: row.step_type,
    label: row.label,
    contractName: row.contract_name,
    abi: row.abi as ParsedAbi,
    bytecode: row.bytecode,
    targetAddress: row.target_address,
    functionName: row.function_name,
    constructorParams: parseStepParams(row.constructor_params),
  };
}

export async function getRecipesByUser(
  client: Supabase,
  userId: string,
): Promise<{ data: Recipe[] | null; error: string | null }> {
  const { data, error } = await client
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getRecipesByUser:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  return { data: data.map(mapRecipeRow), error: null };
}

export async function getRecipeById(
  client: Supabase,
  recipeId: string,
): Promise<{ data: Recipe | null; error: string | null }> {
  if (!recipeId) {
    return { data: null, error: 'Recipe not found' };
  }

  const { data, error } = await client
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .maybeSingle();

  if (error) {
    console.error('getRecipeById:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  if (!data) {
    return { data: null, error: 'Recipe not found' };
  }

  return { data: mapRecipeRow(data), error: null };
}

export async function getRecipeWithSteps(
  client: Supabase,
  recipeId: string,
): Promise<{ data: RecipeWithSteps | null; error: string | null }> {
  if (!recipeId) {
    return { data: null, error: 'Recipe not found' };
  }

  const { data, error } = await client
    .from('recipes')
    .select('*, recipe_steps(*)')
    .eq('id', recipeId)
    .maybeSingle();

  if (error) {
    console.error('getRecipeWithSteps:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  if (!data) {
    return { data: null, error: 'Recipe not found' };
  }

  const row = data as RecipeRow & { recipe_steps: RecipeStepRow[] | null };
  const steps = (row.recipe_steps ?? [])
    .map(mapRecipeStepRow)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  return {
    data: {
      ...mapRecipeRow(row),
      steps,
    },
    error: null,
  };
}

export async function createRecipe(
  client: Supabase,
  userId: string,
  payload: CreateRecipePayload,
): Promise<{ data: Recipe | null; error: string | null }> {
  const { data, error } = await client
    .from('recipes')
    .insert({
      user_id: userId,
      name: payload.name,
      description: payload.description ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createRecipe:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  return { data: mapRecipeRow(data), error: null };
}

export async function updateRecipe(
  client: Supabase,
  recipeId: string,
  payload: UpdateRecipePayload,
): Promise<{ data: Recipe | null; error: string | null }> {
  if (!recipeId) {
    return { data: null, error: 'Recipe not found' };
  }

  const updates: Database['public']['Tables']['recipes']['Update'] = {};

  if (payload.name !== undefined) {
    updates.name = payload.name;
  }
  if (payload.description !== undefined) {
    updates.description = payload.description;
  }
  if (payload.isPublic !== undefined) {
    updates.is_public = payload.isPublic;
  }

  const { data, error } = await client
    .from('recipes')
    .update(updates)
    .eq('id', recipeId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('updateRecipe:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  if (!data) {
    return { data: null, error: 'Recipe not found' };
  }

  return { data: mapRecipeRow(data), error: null };
}

export async function deleteRecipe(
  client: Supabase,
  recipeId: string,
): Promise<{ error: string | null }> {
  if (!recipeId) {
    return { error: 'Recipe not found' };
  }

  const { error } = await client.from('recipes').delete().eq('id', recipeId);

  if (error) {
    console.error('deleteRecipe:', error);
    return { error: formatSupabaseError(error.message) };
  }

  return { error: null };
}
