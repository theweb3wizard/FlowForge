import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth/server';
import { getRecipeWithSteps } from '@/lib/db/recipes';
import { PublicRecipeView } from '@/components/recipe/PublicRecipeView';
import { STARTER_TEMPLATES } from '@/config/starterTemplates';
import type { RecipeWithSteps } from '@/types/recipe';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;

  if (id === 'demo') {
    const demoTemplate = STARTER_TEMPLATES[0];

    if (!demoTemplate) {
      return {
        title: 'Demo Recipe | FlowForge',
        description: 'Preview a demo FlowForge deployment recipe for token and staking workflows.',
      };
    }

    return {
      title: `${demoTemplate.name} | FlowForge Demo Recipe`,
      description: demoTemplate.description,
      openGraph: {
        title: `${demoTemplate.name} | FlowForge Demo Recipe`,
        description: demoTemplate.description,
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app'}/recipe/shared/demo`,
      },
    };
  }

  const { data: recipe } = await getRecipeWithSteps(id);

  if (!recipe || !recipe.isPublic) {
    return {
      title: 'Recipe Not Found | FlowForge',
      description: 'The requested public recipe could not be found.',
    };
  }

  return {
    title: `${recipe.name} | FlowForge Recipe`,
    description:
      recipe.description || 'View this public FlowForge recipe for smart contract deployment and interaction workflows.',
    openGraph: {
      title: `${recipe.name} | FlowForge Recipe`,
      description:
        recipe.description || 'Public FlowForge recipe for smart contract deployment workflows.',
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app'}/recipe/shared/${recipe.id}`,
    },
  };
}

type SharedRecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharedRecipePage({ params }: SharedRecipePageProps) {
  const { id } = await params;

  const { data: session } = await auth.getSession();

  // Handle the special demo route
  if (id === 'demo') {
    const demoTemplate = STARTER_TEMPLATES[0];

    if (!demoTemplate) {
      notFound();
    }

    const demoRecipe: RecipeWithSteps = {
      id: 'demo',
      userId: 'demo',
      name: demoTemplate.name,
      description: demoTemplate.description,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: demoTemplate.steps.map((step, index) => ({
        ...step,
        id: `demo-step-${index}`,
        recipeId: 'demo',
      })),
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <PublicRecipeView
            recipe={demoRecipe}
            isAuthenticated={!!session?.user}
          />
        </div>
      </div>
    );
  }

  // Fetch the real recipe
  const { data: recipe } = await getRecipeWithSteps(id);

  if (!recipe || !recipe.isPublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicRecipeView
          recipe={recipe}
          isAuthenticated={!!session?.user}
        />
      </div>
    </div>
  );
}
