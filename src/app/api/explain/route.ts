import { NextRequest } from 'next/server';
import { generateText } from '@/lib/ai/openrouter';
import { EXPLAIN_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { auth } from '@/lib/auth/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { source, functionName } = await req.json();
  if (!source || typeof source !== 'string') {
    return Response.json({ error: 'No source provided' }, { status: 400 });
  }

  const prompt = functionName
    ? `Explain the function "${functionName}" in this Solidity contract:\n\n${source}`
    : `Explain this Solidity contract:\n\n${source}`;

  try {
    const explanation = await generateText([
      { role: 'system', content: EXPLAIN_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    return Response.json({ explanation });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Explanation failed' }, { status: 500 });
  }
}
