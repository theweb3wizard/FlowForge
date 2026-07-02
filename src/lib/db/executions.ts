import { db } from './index';
import { executions } from './schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateExecutionPayload, Execution, ExecutionStatus, StepResult } from '@/types/execution';

function parseStepResults(value: unknown): StepResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is StepResult => typeof item === 'object' && item !== null && 'stepOrder' in item && 'status' in item,
  );
}

function toDateISO(val: Date | string | null | undefined): string | null {
  if (val == null) return null;
  return val instanceof Date ? val.toISOString() : val;
}

function mapExecutionRow(row: typeof executions.$inferSelect): Execution {
  return {
    id: row.id,
    recipeId: row.recipeId,
    userId: row.userId,
    chainId: row.chainId,
    chainName: row.chainName,
    status: row.status,
    stepResults: parseStepResults(row.stepResults),
    startedAt: toDateISO(row.startedAt)!,
    completedAt: toDateISO(row.completedAt),
  };
}

export async function createExecution(userId: string, payload: CreateExecutionPayload): Promise<{ data: Execution | null; error: string | null }> {
  try {
    const [row] = await db
      .insert(executions)
      .values({
        id: crypto.randomUUID(),
        recipeId: payload.recipeId,
        userId,
        chainId: payload.chainId,
        chainName: payload.chainName,
        status: 'running',
        stepResults: [],
      })
      .returning();
    return { data: mapExecutionRow(row), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('createExecution:', msg);
    return { data: null, error: msg };
  }
}

export async function updateExecutionStepResult(
  executionId: string,
  stepResult: StepResult,
  currentStepResults: StepResult[],
): Promise<{ error: string | null }> {
  try {
    const updatedResults = [...currentStepResults, stepResult];
    await db.update(executions).set({ stepResults: updatedResults }).where(eq(executions.id, executionId));
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('updateExecutionStepResult:', msg);
    return { error: msg };
  }
}

export async function finalizeExecution(
  executionId: string,
  status: Extract<ExecutionStatus, 'success' | 'partial' | 'failed'>,
): Promise<{ error: string | null }> {
  try {
    await db
      .update(executions)
      .set({ status, completedAt: new Date() })
      .where(eq(executions.id, executionId));
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('finalizeExecution:', msg);
    return { error: msg };
  }
}

export async function getExecutionsByRecipe(recipeId: string): Promise<{ data: Execution[] | null; error: string | null }> {
  try {
    const rows = await db.select().from(executions).where(eq(executions.recipeId, recipeId)).orderBy(desc(executions.startedAt));
    return { data: rows.map(mapExecutionRow), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getExecutionsByRecipe:', msg);
    return { data: null, error: msg };
  }
}

export async function getExecutionById(executionId: string): Promise<{ data: Execution | null; error: string | null }> {
  if (!executionId) return { data: null, error: 'Execution not found' };
  try {
    const [row] = await db.select().from(executions).where(eq(executions.id, executionId)).limit(1);
    if (!row) return { data: null, error: 'Execution not found' };
    return { data: mapExecutionRow(row), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'An unexpected database error occurred. Please try again.';
    console.error('getExecutionById:', msg);
    return { data: null, error: msg };
  }
}
