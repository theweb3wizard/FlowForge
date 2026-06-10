import { NextRequest } from 'next/server';
import { generateText } from '@/lib/ai/openrouter';
import { GENERATE_SYSTEM_PROMPT, FIX_SYSTEM_PROMPT, buildGenerationPrompt } from '@/lib/ai/prompts';
import { retrievePatterns } from '@/lib/ai/patterns';
import { createServerClient } from '@/lib/supabase/server';
import { checkCompileErrors, compileSolidity } from '@/lib/compiler/solc';

export const runtime = 'nodejs';

const MAX_FIX_ATTEMPTS = 3;
const AI_TIMEOUT_MS = 45_000;

function signalWithTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

async function generateWithTimeout(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  return generateText(messages as any, { signal: signalWithTimeout(AI_TIMEOUT_MS) });
}

async function runCompileFixLoop(
  prompt: string,
  onProgress: (msg: string) => void,
): Promise<{ code: string; attempts: number; success: boolean }> {
  let code = '';
  let errorLines = '';

  // Retrieve relevant pattern examples for few-shot prompting
  const matchedPatterns = retrievePatterns(prompt, 2);
  const patternExamples = matchedPatterns
    .map((p, i) => `// Example ${i + 1}: ${p.name}\n${p.code}`)
    .join('\n\n');

  for (let attempts = 0; attempts < MAX_FIX_ATTEMPTS; attempts++) {
    if (attempts === 0) {
      onProgress('// 🤖 Generating initial code...\n');
      code = await generateWithTimeout([
        { role: 'system', content: GENERATE_SYSTEM_PROMPT },
        { role: 'user', content: buildGenerationPrompt(prompt, patternExamples) },
      ]);
    } else {
      onProgress(`// 🛠️ Fix attempt ${attempts}/${MAX_FIX_ATTEMPTS - 1}...\n`);
      code = await generateWithTimeout([
        { role: 'system', content: FIX_SYSTEM_PROMPT },
        { role: 'user', content: `Original prompt: ${prompt}\n\nFailed code:\n${code}\n\nCompiler errors:\n${errorLines}\n\nFix all errors and return only the corrected Solidity code.` },
      ]);

      if (code.includes('// @fix-failed')) {
        onProgress('// ⚠️ AI could not fix the remaining errors. Outputting best attempt.\n');
        return { code, attempts: attempts + 1, success: false };
      }
    }

    onProgress('// 🔍 Checking compilation...\n');
    const errors = await checkCompileErrors(code);

    if (errors.length === 0) {
      onProgress(`// ✅ Compiled successfully on attempt ${attempts + 1}\n`);
      return { code, attempts: attempts + 1, success: true };
    }

    errorLines = errors.map((e) => `Line ${e.line}: ${e.message}`).join('\n');

    if (attempts >= MAX_FIX_ATTEMPTS - 1) {
      onProgress(`// ⚠️ ${errors.length} compiler error(s) remaining after ${attempts + 1} attempt(s)\n`);
      return { code, attempts: attempts + 1, success: false };
    }

    onProgress(`// ⚠️ ${errors.length} error(s). Sending to AI for fix...\n`);
  }

  return { code, attempts: MAX_FIX_ATTEMPTS, success: false };
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const anonToken = req.headers.get('x-anon-token');
  let prompt: string;
  try {
    const body = await req.json();
    prompt = body.prompt;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return Response.json({ error: 'Invalid prompt (max 2000 chars)' }, { status: 400 });
  }

  // Quota check
  if (user) {
    const { count } = await supabase
      .from('generation_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('generated_at', new Date(Date.now() - 86400000).toISOString());

    if (count && count >= 10) {
      return Response.json({ error: 'Daily generation limit reached (10/day).' }, { status: 429 });
    }
  } else if (anonToken) {
    const { count } = await supabase
      .from('generation_log')
      .select('*', { count: 'exact', head: true })
      .eq('anon_token', anonToken)
      .gte('generated_at', new Date(Date.now() - 86400000).toISOString());

    if (count && count >= 3) {
      return Response.json({ error: 'Anonymous limit reached. Sign up for 10/day.' }, { status: 429 });
    }
  } else {
    return Response.json({ error: 'Authentication or anonymous token required.' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch { /* stream closed */ }
      };

      const { code, attempts, success } = await runCompileFixLoop(prompt, send);

      // Send the final clean code (strip progress comments for final output)
      const cleanCode = code
        .replace(/^\/\/ 🤖.*\n?/gm, '')
        .replace(/^\/\/ 🛠️.*\n?/gm, '')
        .replace(/^\/\/ 🔍.*\n?/gm, '')
        .replace(/^\/\/ ⚠️.*\n?/gm, '')
        .replace(/^\/\/ ✅.*\n?/gm, '')
        .trim();

      if (cleanCode) {
        send(cleanCode);
      } else {
        send(code);
      }

      if (success) {
        send(`\n\n// ✅ Compiled successfully after ${attempts} attempt(s)`);
      } else {
        send(`\n\n// ⚠️ Manual fixes may be needed. The AI attempted ${attempts} fix round(s).`);
      }

      // Fire-and-forget log
      if (user || anonToken) {
        const logData: Record<string, any> = {
          prompt,
          model_used: 'openrouter',
          compiled: success,
          fix_attempts: attempts,
        };
        if (user) logData.user_id = user.id;
        if (anonToken) logData.anon_token = anonToken;
        supabase.from('generation_log').insert(logData).then().catch(() => {});
      }

      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
