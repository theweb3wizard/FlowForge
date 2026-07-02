import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { getRecipeWithSteps } from '@/lib/db/recipes';
import { BuilderPage } from '@/components/builder/BuilderPage';

type BuilderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeBuilderPage({ params }: BuilderPageProps) {
  const { id } = await params;
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    notFound();
  }

  const { data: recipe } = await getRecipeWithSteps(id);

  if (!recipe) {
    notFound();
  }

  if (recipe.userId !== session.user.id) {
    notFound();
  }

  return <BuilderPage recipe={recipe} />;
}
