import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getRecipeWithSteps } from '@/lib/supabase/recipes';
import type { Supabase } from '@/lib/supabase/databaseClient';
import { RunModal } from '@/components/execution/RunModal';

type RunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: recipe } = await getRecipeWithSteps(supabase as Supabase, id);

  if (!recipe || recipe.userId !== user.id) {
    notFound();
  }

  return <RunModal recipe={recipe} />;
}
