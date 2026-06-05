import { createServerClient } from '@/lib/supabase/server';
import { getRecipesByUser } from '@/lib/supabase/recipes';
import { getStepsByRecipe } from '@/lib/supabase/recipeSteps';
import type { Supabase } from '@/lib/supabase/databaseClient';
import { CreateRecipeDialog } from '@/components/recipe/CreateRecipeDialog';
import { RecipeList } from '@/components/recipe/RecipeList';
import type { Recipe } from '@/types/recipe';

async function buildStepCounts(
  recipes: Recipe[],
  supabase: Supabase,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  await Promise.all(
    recipes.map(async (recipe) => {
      const { data: steps } = await getStepsByRecipe(supabase, recipe.id);
      counts[recipe.id] = steps?.length ?? 0;
    }),
  );

  return counts;
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes, error } = await getRecipesByUser(
    supabase as Supabase,
    user?.id ?? '',
  );

  const recipeList = recipes ?? [];
  const stepCounts = await buildStepCounts(recipeList, supabase as Supabase);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Recipes</h1>
          <p className="text-sm text-muted-foreground">
            {recipeList.length} recipe{recipeList.length === 1 ? '' : 's'}
          </p>
        </div>
        <CreateRecipeDialog />
      </div>

      <RecipeList
        recipes={recipeList}
        stepCounts={stepCounts}
        error={error}
      />
    </div>
  );
}
