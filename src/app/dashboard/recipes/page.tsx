'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useTemplates } from '@/hooks/use-queries';
import { Recipe } from '@/types/recipe';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeLibrary } from '@/components/recipes/RecipeLibrary';
import { RecipeExecutorModal } from '@/components/recipes/RecipeExecutorModal';
import { SimpleRecipeBuilder } from '@/components/recipes/SimpleRecipeBuilder';
import { RecipeExecutionHistory } from '@/components/recipes/RecipeExecutionHistory';
import { PlusCircle, BookOpen, Layers, History } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function RecipesPage() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const { data: templates = [] } = useTemplates();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showExecutor, setShowExecutor] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const handleRunRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowExecutor(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setShowBuilder(true);
  };

  const handleRecipeCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes', 'my', address] });
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setRecipeToEdit(null);
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

      {/* NEW: Tabs for Recipes and History */}
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            My Recipes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Execution History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes">
          <RecipeLibrary
            onRunRecipe={handleRunRecipe}
            onViewRecipe={(recipe) => console.log('View:', recipe)}
            onEditRecipe={handleEditRecipe}
          />
        </TabsContent>

        <TabsContent value="history">
          <RecipeExecutionHistory />
        </TabsContent>
      </Tabs>

      <SimpleRecipeBuilder
        isOpen={showBuilder}
        onClose={handleBuilderClose}
        templates={templates}
        onRecipeCreated={handleRecipeCreated}
        initialRecipe={recipeToEdit}
      />

      <RecipeExecutorModal
        recipe={selectedRecipe}
        isOpen={showExecutor}
        onClose={() => {
          setShowExecutor(false);
          setSelectedRecipe(null);
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
          queryClient.invalidateQueries({ queryKey: ['deployments'] });
          queryClient.invalidateQueries({ queryKey: ['recipe-executions'] }); // NEW: Invalidate history
        }}
      />
    </div>
  );
}