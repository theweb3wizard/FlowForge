'use server';

import { auth } from '@/lib/auth/server';
import { createExecution, finalizeExecution, updateExecutionStepResult } from '@/lib/db/executions';
import type { CreateExecutionPayload, Execution, StepResult, ExecutionStatus } from '@/types/execution';
import { db } from '@/lib/db/index';
import { executions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

function parseStepResults(value: unknown): StepResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is StepResult => typeof item === 'object' && item !== null && 'stepOrder' in item && 'status' in item,
  );
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
    startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : String(row.startedAt ?? ''),
    completedAt: row.completedAt instanceof Date ? row.completedAt.toISOString() : (row.completedAt ?? null),
  };
}

export async function createExecutionAction(
  payload: CreateExecutionPayload,
): Promise<{ data: Execution | null; error: string | null }> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { data: null, error: 'You must be signed in.' };
  return createExecution(session.user.id, payload);
}

export async function updateExecutionStepResultAction(
  executionId: string,
  stepResult: StepResult,
  currentStepResults: StepResult[],
): Promise<{ error: string | null }> {
  return updateExecutionStepResult(executionId, stepResult, currentStepResults);
}

export async function finalizeExecutionAction(
  executionId: string,
  status: Extract<ExecutionStatus, 'success' | 'partial' | 'failed'>,
): Promise<{ error: string | null }> {
  return finalizeExecution(executionId, status);
}

export async function getLatestExecutionAction(
  recipeId: string,
): Promise<{ data: Execution | null; error: string | null }> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { data: null, error: 'Not authenticated' };
  try {
    const [row] = await db
      .select()
      .from(executions)
      .where(and(eq(executions.recipeId, recipeId), eq(executions.userId, session.user.id)))
      .orderBy(desc(executions.startedAt))
      .limit(1);
    if (!row) return { data: null, error: null };
    return { data: mapExecutionRow(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to fetch execution' };
  }
}
