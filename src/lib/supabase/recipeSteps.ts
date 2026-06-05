import type { Database } from '@/lib/supabase/types';
import type { Supabase } from '@/lib/supabase/databaseClient';
import type { ParsedAbi } from '@/types/abi';
import type { RecipeStep, UpsertStepPayload } from '@/types/recipe';
import type { StepParamConfig } from '@/types/recipe';

type RecipeStepRow = Database['public']['Tables']['recipe_steps']['Row'];

function formatSupabaseError(message: string): string {
  return message || 'An unexpected database error occurred. Please try again.';
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

function toStepInsert(step: UpsertStepPayload): Database['public']['Tables']['recipe_steps']['Insert'] {
  return {
    id: step.id,
    recipe_id: step.recipeId,
    step_order: step.stepOrder,
    step_type: step.stepType,
    label: step.label,
    contract_name: step.contractName,
    abi: step.abi,
    bytecode: step.bytecode,
    target_address: step.targetAddress,
    function_name: step.functionName,
    constructor_params: step.constructorParams,
  };
}

export async function getStepsByRecipe(
  client: Supabase,
  recipeId: string,
): Promise<{ data: RecipeStep[] | null; error: string | null }> {
  const { data, error } = await client
    .from('recipe_steps')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('step_order', { ascending: true });

  if (error) {
    console.error('getStepsByRecipe:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  return { data: data.map(mapRecipeStepRow), error: null };
}

export async function upsertSteps(
  client: Supabase,
  steps: UpsertStepPayload[],
): Promise<{ data: RecipeStep[] | null; error: string | null }> {
  if (steps.length === 0) {
    return { data: [], error: null };
  }

  // Separate new steps (no id) from existing steps (have a real uuid id).
  // temp_ prefixed IDs from the builder store are treated as new inserts.
  const newSteps = steps.filter(
    (s) => !s.id || s.id.startsWith('temp_'),
  );
  const existingSteps = steps.filter(
    (s) => s.id && !s.id.startsWith('temp_'),
  );

  const allMapped: RecipeStep[] = [];

  // Insert brand-new steps (no id — Supabase generates uuid)
  if (newSteps.length > 0) {
    const insertRows = newSteps.map((step) => {
      const row = toStepInsert(step);
      // Remove id so Supabase auto-generates it
      const { id: _omit, ...rowWithoutId } = row;
      return rowWithoutId;
    });

    const { data, error } = await client
      .from('recipe_steps')
      .insert(insertRows)
      .select('*');

    if (error) {
      console.error('upsertSteps (insert):', error);
      return { data: null, error: formatSupabaseError(error.message) };
    }

    allMapped.push(...data.map(mapRecipeStepRow));
  }

  // Upsert existing steps (have a real uuid id — update on conflict)
  if (existingSteps.length > 0) {
    const upsertRows = existingSteps.map(toStepInsert);

    const { data, error } = await client
      .from('recipe_steps')
      .upsert(upsertRows, { onConflict: 'id' })
      .select('*');

    if (error) {
      console.error('upsertSteps (upsert):', error);
      return { data: null, error: formatSupabaseError(error.message) };
    }

    allMapped.push(...data.map(mapRecipeStepRow));
  }

  return {
    data: allMapped.sort((a, b) => a.stepOrder - b.stepOrder),
    error: null,
  };
}

export async function deleteStep(
  client: Supabase,
  stepId: string,
): Promise<{ error: string | null }> {
  if (!stepId) {
    return { error: 'Step not found' };
  }

  const { error } = await client.from('recipe_steps').delete().eq('id', stepId);

  if (error) {
    console.error('deleteStep:', error);
    return { error: formatSupabaseError(error.message) };
  }

  return { error: null };
}

export async function reorderSteps(
  client: Supabase,
  recipeId: string,
  orderedStepIds: string[],
): Promise<{ error: string | null }> {
  for (let index = 0; index < orderedStepIds.length; index++) {
    const stepId = orderedStepIds[index];

    const { error } = await client
      .from('recipe_steps')
      .update({ step_order: index })
      .eq('id', stepId)
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('reorderSteps:', error);
      return { error: formatSupabaseError(error.message) };
    }
  }

  return { error: null };
}
