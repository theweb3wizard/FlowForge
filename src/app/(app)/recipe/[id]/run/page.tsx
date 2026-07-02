import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { getRecipeWithSteps } from '@/lib/db/recipes';
import { RunModal } from '@/components/execution/RunModal';

type RunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    notFound();
  }

  const { data: recipe } = await getRecipeWithSteps(id);

  if (!recipe || recipe.userId !== session.user.id) {
    notFound();
  }

  return <RunModal recipe={recipe} />;
}
