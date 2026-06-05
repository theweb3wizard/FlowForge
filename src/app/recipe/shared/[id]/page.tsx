import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getRecipeWithSteps } from '@/lib/supabase/recipes';
import type { Supabase } from '@/lib/supabase/databaseClient';
import { PublicRecipeView } from '@/components/recipe/PublicRecipeView';
import { STARTER_TEMPLATES } from '@/config/starterTemplates';
import type { RecipeWithSteps } from '@/types/recipe';

type SharedRecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharedRecipePage({ params }: SharedRecipePageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Check auth status (no redirect — this is a public page)
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
            isAuthenticated={!!user}
          />
        </div>
      </div>
    );
  }

  // Fetch the real recipe — RLS allows reading is_public = true without auth
  const { data: recipe } = await getRecipeWithSteps(supabase as Supabase, id);

  if (!recipe || !recipe.isPublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicRecipeView
          recipe={recipe}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  );
}
