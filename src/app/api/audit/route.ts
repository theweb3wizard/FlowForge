import { NextRequest } from 'next/server';
import { generateJSON } from '@/lib/ai/openrouter';
import { AUDIT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { auth } from '@/lib/auth/server';
import type { SecurityFinding } from '@/types/playground';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return Response.json({ error: 'Authentication required for security audit.' }, { status: 401 });
  }

  const { source } = await req.json();
  if (!source || typeof source !== 'string') {
    return Response.json({ error: 'No source provided' }, { status: 400 });
  }

  if (source.length > 50000) {
    return Response.json({ error: 'Source too large (max 50KB)' }, { status: 413 });
  }

  try {
    const result = await generateJSON<{ findings: SecurityFinding[] }>(
      [
        { role: 'system', content: AUDIT_SYSTEM_PROMPT },
        { role: 'user', content: `Audit this Solidity contract:\n\n${source}` },
      ],
      { depth: 'deep' },
    );

    return Response.json({ findings: result.findings ?? [] });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Audit failed' }, { status: 500 });
  }
}
