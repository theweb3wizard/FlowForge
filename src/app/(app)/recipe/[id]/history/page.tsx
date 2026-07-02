import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth/server';
import { getRecipeWithSteps } from '@/lib/db/recipes';
import { getExecutionsByRecipe } from '@/lib/db/executions';
import { ExecutionHistoryList } from '@/components/execution/ExecutionHistoryList';
import { Button } from '@/components/ui/button';

type HistoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params;
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    notFound();
  }

  const { data: recipe } = await getRecipeWithSteps(id);

  if (!recipe || recipe.userId !== session.user.id) {
    notFound();
  }

  const { data: executions, error } = await getExecutionsByRecipe(id);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/recipe/${id}/builder`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Execution History</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load execution history. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/recipe/${id}/builder`} aria-label="Back to builder">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Execution History</h1>
            <p className="text-sm text-muted-foreground">{recipe.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/recipe/${id}/run`}>Run Recipe</Link>
        </Button>
      </div>

      <ExecutionHistoryList
        executions={executions ?? []}
        totalSteps={recipe.steps.length}
        recipeName={recipe.name}
      />
    </div>
  );
}
