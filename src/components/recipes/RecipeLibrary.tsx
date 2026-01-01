'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/use-queries';
import { Recipe } from '@/types/recipe';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Layers, Clock, User, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

interface RecipeLibraryProps {
  onRunRecipe: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

export function RecipeLibrary({ onRunRecipe, onViewRecipe }: RecipeLibraryProps) {
  const [filter, setFilter] = useState<'my' | 'public'>('my');
  const { data: recipes = [], isLoading } = useRecipes(filter);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">
          {filter === 'my' ? 'No recipes yet' : 'No public recipes available'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {filter === 'my'
            ? 'Create your first deployment recipe to get started'
            : 'Check back later for community recipes'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={filter === 'my' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('my')}
        >
          <User className="h-4 w-4 mr-2" />
          My Recipes
        </Button>
        <Button
          variant={filter === 'public' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('public')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Public Recipes
        </Button>
      </div>

      {/* Recipe Cards */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {recipe.description}
                  </p>
                </div>
                <Button
                  onClick={() => onRunRecipe(recipe)}
                  size="sm"
                  className="ml-4"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {recipe.network && (
                  <Badge variant="outline">{recipe.network}</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  {recipe.steps.length} steps
                </div>
                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {recipe.execution_count} runs
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true })}
                </div>
              </div>

              {filter === 'public' && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  by {recipe.creator_address.slice(0, 6)}...{recipe.creator_address.slice(-4)}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
