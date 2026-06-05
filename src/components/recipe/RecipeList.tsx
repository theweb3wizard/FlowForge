'use client';

import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreateRecipeDialog } from '@/components/recipe/CreateRecipeDialog';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { StarterTemplateGallery } from '@/components/recipe/StarterTemplateGallery';
import type { Recipe } from '@/types/recipe';

type RecipeListProps = {
  recipes: Recipe[];
  stepCounts: Record<string, number>;
  error: string | null;
};

export function RecipeList({ recipes, stepCounts, error }: RecipeListProps) {
  const [items, setItems] = useState(recipes);

  const handleDeleted = (recipeId: string) => {
    setItems((current) => current.filter((recipe) => recipe.id !== recipeId));
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Failed to load recipes. Please refresh the page.
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Code2 className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">No recipes yet.</p>
              <p className="text-sm text-muted-foreground">
                Create your first deployment workflow.
              </p>
            </div>
            <CreateRecipeDialog trigger={<Button>Create Recipe</Button>} />
          </CardContent>
        </Card>

        <Separator />

        <StarterTemplateGallery />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          stepCount={stepCounts[recipe.id] ?? 0}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
