'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { createRecipe } from '@/lib/supabase/recipes';
import { upsertSteps } from '@/lib/supabase/recipeSteps';
import { STARTER_TEMPLATES, type StarterTemplate } from '@/config/starterTemplates';
import type { UpsertStepPayload } from '@/types/recipe';

export function StarterTemplateGallery() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleLoadTemplate = async (template: StarterTemplate) => {
    setLoadingId(template.id);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be signed in to use a template.');
        setLoadingId(null);
        return;
      }

      const { data: recipe, error: recipeError } = await createRecipe(
        supabase,
        user.id,
        {
          name: template.name,
          description: template.description,
        },
      );

      if (recipeError || !recipe) {
        toast.error(recipeError ?? 'Failed to create recipe from template.');
        setLoadingId(null);
        return;
      }

      if (template.steps.length > 0) {
        const stepPayloads: UpsertStepPayload[] = template.steps.map((step) => ({
          ...step,
          recipeId: recipe.id,
          // No id — Supabase will generate new UUIDs on insert
        }));

        const { error: stepsError } = await upsertSteps(supabase, stepPayloads);

        if (stepsError) {
          toast.error('Template loaded but steps failed to save. Please try again.');
          setLoadingId(null);
          return;
        }
      }

      toast.success(`"${template.name}" loaded. Start configuring your steps.`);
      router.push(`/recipe/${recipe.id}/builder`);
    } catch (err) {
      console.error('Load template failed:', err);
      toast.error('Failed to load template. Please try again.');
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold">Start from a Template</h2>
        <p className="text-sm text-muted-foreground">
          Pre-built workflows for common deployment patterns.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STARTER_TEMPLATES.map((template) => {
          const isLoading = loadingId === template.id;

          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-snug">
                    {template.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs"
                  >
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {template.steps.length}{' '}
                  {template.steps.length === 1 ? 'step' : 'steps'}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={loadingId !== null}
                  onClick={() => handleLoadTemplate(template)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Use Template'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
