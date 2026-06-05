'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DeleteRecipeDialog } from '@/components/recipe/DeleteRecipeDialog';
import type { Recipe } from '@/types/recipe';
import { formatRelativeTime } from '@/utils/formatDate';

type RecipeCardProps = {
  recipe: Recipe;
  stepCount: number;
  onDeleted: (recipeId: string) => void;
};

export function RecipeCard({ recipe, stepCount, onDeleted }: RecipeCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-1 text-base">{recipe.name}</CardTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/recipe/${recipe.id}/builder`} aria-label="Edit recipe">
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete recipe"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {recipe.description ? (
              recipe.description
            ) : (
              <span className="italic">No description</span>
            )}
          </p>
        </CardHeader>
        <CardContent className="flex items-center gap-2 pb-3">
          <Badge variant="secondary">{stepCount} steps</Badge>
          <span className="text-xs text-muted-foreground">
            Updated {formatRelativeTime(recipe.updatedAt)}
          </span>
        </CardContent>
        <CardFooter className="mt-auto pt-0">
          <Button className="w-full" asChild>
            <Link href={`/recipe/${recipe.id}/run`}>Run</Link>
          </Button>
        </CardFooter>
      </Card>

      <DeleteRecipeDialog
        recipeId={recipe.id}
        recipeName={recipe.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
