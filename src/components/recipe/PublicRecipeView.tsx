'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cloneRecipeAction } from '@/lib/actions/recipeActions';
import { truncateAddress } from '@/utils/formatAddress';
import type { RecipeWithSteps } from '@/types/recipe';

type PublicRecipeViewProps = {
  recipe: RecipeWithSteps;
  isAuthenticated: boolean;
};

export function PublicRecipeView({
  recipe,
  isAuthenticated,
}: PublicRecipeViewProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyRecipe = async () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?returnUrl=/recipe/shared/${recipe.id}`);
      return;
    }

    setIsCopying(true);
    const result = await cloneRecipeAction(recipe.id);
    setIsCopying(false);

    if (!result.success || !result.newRecipeId) {
      toast.error(result.error ?? 'Failed to copy recipe. Please try again.');
      return;
    }

    toast.success('Recipe copied to your account.');
    router.push(`/recipe/${result.newRecipeId}/builder`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Use as Template
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
          </div>
          <Button
            onClick={handleCopyRecipe}
            disabled={isCopying}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {isCopying
              ? 'Copying…'
              : isAuthenticated
              ? 'Copy Recipe'
              : 'Sign in to Copy'}
          </Button>
        </div>

        {recipe.description && (
          <p className="text-muted-foreground max-w-2xl">{recipe.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono text-xs">
            by {truncateAddress(recipe.userId)}
          </span>
          <span>·</span>
          <Badge variant="secondary">{recipe.steps.length} steps</Badge>
        </div>
      </div>

      <Separator />

      {/* Step List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Steps</h2>
        {recipe.steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">This recipe has no steps.</p>
        ) : (
          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <Card key={step.id} className="border-border">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-mono font-medium text-muted-foreground">
                      {step.stepOrder + 1}
                    </span>
                    <CardTitle className="text-sm font-medium">{step.label}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        step.stepType === 'deploy'
                          ? 'border-blue-500/40 text-blue-400 text-xs'
                          : 'border-amber-500/40 text-amber-400 text-xs'
                      }
                    >
                      {step.stepType === 'deploy' ? 'DEPLOY' : 'INTERACT'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {step.contractName && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {step.contractName}
                      </span>
                    )}
                    {step.stepType === 'interact' && step.functionName && (
                      <span className="flex items-center gap-1 font-mono">
                        <ExternalLink className="h-3 w-3" />
                        {step.functionName}()
                      </span>
                    )}
                    {step.constructorParams.length > 0 && (
                      <span>
                        {step.constructorParams.length}{' '}
                        {step.constructorParams.length === 1 ? 'param' : 'params'}
                        {step.constructorParams.some((p) => p.isVariable) && (
                          <span className="ml-1 text-amber-400">
                            · uses variable{step.constructorParams.filter((p) => p.isVariable).length > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleCopyRecipe}
          disabled={isCopying}
          size="lg"
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          {isCopying
            ? 'Copying…'
            : isAuthenticated
            ? 'Copy Recipe to My Account'
            : 'Sign in to Copy This Recipe'}
        </Button>
      </div>
    </div>
  );
}
