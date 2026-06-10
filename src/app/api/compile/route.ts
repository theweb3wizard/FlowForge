import { NextRequest } from 'next/server';
import { compileSolidity } from '@/lib/compiler/solc';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { source } = await req.json();

  if (!source || typeof source !== 'string') {
    return Response.json({ error: 'Invalid source code' }, { status: 400 });
  }

  if (source.length > 50000) {
    return Response.json({ error: 'Source too large (max 50KB)' }, { status: 413 });
  }

  const result = await compileSolidity(source);
  return Response.json(result);
}
