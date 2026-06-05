import type { Database } from '@/lib/supabase/types';
import type { Supabase } from '@/lib/supabase/databaseClient';
import type {
  CreateExecutionPayload,
  Execution,
  ExecutionStatus,
  StepResult,
} from '@/types/execution';

type ExecutionRow = Database['public']['Tables']['executions']['Row'];

function formatSupabaseError(message: string): string {
  return message || 'An unexpected database error occurred. Please try again.';
}

function parseStepResults(value: unknown): StepResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is StepResult =>
      typeof item === 'object' &&
      item !== null &&
      'stepOrder' in item &&
      'status' in item,
  );
}

function mapExecutionRow(row: ExecutionRow): Execution {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    chainId: row.chain_id,
    chainName: row.chain_name,
    status: row.status,
    stepResults: parseStepResults(row.step_results),
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export async function createExecution(
  client: Supabase,
  userId: string,
  payload: CreateExecutionPayload,
): Promise<{ data: Execution | null; error: string | null }> {
  const { data, error } = await client
    .from('executions')
    .insert({
      recipe_id: payload.recipeId,
      user_id: userId,
      chain_id: payload.chainId,
      chain_name: payload.chainName,
      status: 'running',
      step_results: [],
    })
    .select('*')
    .single();

  if (error) {
    console.error('createExecution:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  return { data: mapExecutionRow(data), error: null };
}

export async function updateExecutionStepResult(
  client: Supabase,
  executionId: string,
  stepResult: StepResult,
  currentStepResults: StepResult[],
): Promise<{ error: string | null }> {
  const updatedResults = [...currentStepResults, stepResult];

  const { error } = await client
    .from('executions')
    .update({ step_results: updatedResults })
    .eq('id', executionId);

  if (error) {
    console.error('updateExecutionStepResult:', error);
    return { error: formatSupabaseError(error.message) };
  }

  return { error: null };
}

export async function finalizeExecution(
  client: Supabase,
  executionId: string,
  status: Extract<ExecutionStatus, 'success' | 'partial' | 'failed'>,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('executions')
    .update({
      status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  if (error) {
    console.error('finalizeExecution:', error);
    return { error: formatSupabaseError(error.message) };
  }

  return { error: null };
}

export async function getExecutionsByRecipe(
  client: Supabase,
  recipeId: string,
): Promise<{ data: Execution[] | null; error: string | null }> {
  const { data, error } = await client
    .from('executions')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('getExecutionsByRecipe:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  return { data: data.map(mapExecutionRow), error: null };
}

export async function getExecutionById(
  client: Supabase,
  executionId: string,
): Promise<{ data: Execution | null; error: string | null }> {
  if (!executionId) {
    return { data: null, error: 'Execution not found' };
  }

  const { data, error } = await client
    .from('executions')
    .select('*')
    .eq('id', executionId)
    .maybeSingle();

  if (error) {
    console.error('getExecutionById:', error);
    return { data: null, error: formatSupabaseError(error.message) };
  }

  if (!data) {
    return { data: null, error: 'Execution not found' };
  }

  return { data: mapExecutionRow(data), error: null };
}
