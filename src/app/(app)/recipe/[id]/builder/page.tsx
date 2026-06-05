import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getRecipeWithSteps } from '@/lib/supabase/recipes';
import type { Supabase } from '@/lib/supabase/databaseClient';
import { BuilderPage } from '@/components/builder/BuilderPage';

type BuilderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeBuilderPage({ params }: BuilderPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: recipe } = await getRecipeWithSteps(supabase as Supabase, id);

  if (!recipe) {
    notFound();
  }

  // Verify ownership — RLS also enforces this, but we surface notFound cleanly
  if (recipe.userId !== user.id) {
    notFound();
  }

  return <BuilderPage recipe={recipe} />;
}
