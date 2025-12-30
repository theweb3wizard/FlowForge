'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Recipe } from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { getActiveTemplates } from '@/lib/supabase/templates';
import { Button } from '@/components/ui/button';
import { RecipeLibrary } from '@/components/recipes/RecipeLibrary';
import { RecipeExecutorModal } from '@/components/recipes/RecipeExecutorModal';
import { SimpleRecipeBuilder } from '@/components/recipes/SimpleRecipeBuilder';
import { PlusCircle, BookOpen } from 'lucide-react';

export default function RecipesPage() {
  const { address } = useWallet();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showExecutor, setShowExecutor] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await getActiveTemplates();
    setTemplates(data);
  };

  const handleRunRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowExecutor(true);
  };

  const handleRecipeCreated = () => {
    setRefreshKey((prev) => prev + 1); // Refresh library
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to create and run deployment recipes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Deployment Recipes</h1>
          <p className="text-muted-foreground">
            Create repeatable multi-step deployment workflows
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Recipe
        </Button>
      </div>

      <RecipeLibrary
        key={refreshKey}
        onRunRecipe={handleRunRecipe}
        onViewRecipe={(recipe) => console.log('View:', recipe)}
      />

      <SimpleRecipeBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        templates={templates}
        onRecipeCreated={handleRecipeCreated}
      />

      <RecipeExecutorModal
        recipe={selectedRecipe}
        isOpen={showExecutor}
        onClose={() => {
          setShowExecutor(false);
          setSelectedRecipe(null);
          setRefreshKey((prev) => prev + 1); // Refresh library after execution
        }}
      />
    </div>
  );
}