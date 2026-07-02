import { auth } from '@/lib/auth/server';
import { getRecipesByUser, getStepCountsForRecipes } from '@/lib/db/recipes';
import { CreateRecipeDialog } from '@/components/recipe/CreateRecipeDialog';
import { RecipeList } from '@/components/recipe/RecipeList';

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id ?? '';

  const { data: recipes, error } = await getRecipesByUser(userId);

  const recipeList = recipes ?? [];
  const stepCounts = await getStepCountsForRecipes(recipeList);

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
