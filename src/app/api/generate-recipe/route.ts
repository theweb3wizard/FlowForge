import { NextRequest } from 'next/server';
import { generateJSON } from '@/lib/ai/openrouter';
import { RECIPE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type GeneratedStep = {
  stepType: 'deploy' | 'interact';
  label: string;
  contractName: string | null;
  functionName: string | null;
  sourceCode: string;
  constructorParams: Array<{
    name: string;
    type: string;
    value: string;
    isVariable: boolean;
    variableRef: string | null;
  }>;
};

type GeneratedRecipe = {
  recipeName: string;
  recipeDescription: string;
  steps: GeneratedStep[];
};

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return Response.json({ error: 'Invalid prompt (max 2000 chars)' }, { status: 400 });
  }

  try {
    const recipe = await generateJSON<GeneratedRecipe>(
      [
        { role: 'system', content: RECIPE_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a deployment workflow for: ${prompt}` },
      ],
      { depth: 'deep' },
    );

    if (!recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      return Response.json({ error: 'Failed to generate recipe steps.' }, { status: 500 });
    }

    return Response.json(recipe);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Recipe generation failed' }, { status: 500 });
  }
}
