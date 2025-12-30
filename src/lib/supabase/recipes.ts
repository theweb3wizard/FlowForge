import { supabase } from '@/lib/supabase'; 
import { Recipe, RecipeExecution, CreateRecipePayload } from '@/types/recipe';

/**
 * Create a new recipe
 */
export async function createRecipe(payload: CreateRecipePayload): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        name: payload.name,
        description: payload.description,
        creator_address: payload.creator_address.toLowerCase(),
        steps: payload.steps,
        network: payload.network,
        is_public: payload.is_public ?? false,
        tags: payload.tags ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating recipe:', error);
    return null;
  }
}

/**
 * Get all recipes (optionally filter by creator or public)
 */
export async function getRecipes(
  creatorAddress?: string,
  publicOnly: boolean = false
): Promise<Recipe[]> {
  try {
    let query = supabase.from('recipes').select('*').order('created_at', { ascending: false });

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    if (creatorAddress) {
      query = query.eq('creator_address', creatorAddress.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

/**
 * Get a single recipe by ID
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

/**
 * Update recipe execution count
 */
export async function incrementRecipeExecutionCount(recipeId: string): Promise<void> {
  try {
    await supabase.rpc('increment_recipe_execution_count', { recipe_id: recipeId });
  } catch (error) {
    console.error('Error incrementing execution count:', error);
  }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }
}

/**
 * Create a recipe execution record
 */
export async function createRecipeExecution(
  recipeId: string,
  executorAddress: string,
  totalSteps: number
): Promise<RecipeExecution | null> {
  try {
    const { data, error } = await supabase
      .from('recipe_executions')
      .insert({
        recipe_id: recipeId,
        executor_address: executorAddress.toLowerCase(),
        status: 'running',
        current_step: 0,
        total_steps: totalSteps,
        step_results: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe execution:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating recipe execution:', error);
    return null;
  }
}

/**
 * Update recipe execution progress
 */
export async function updateRecipeExecution(
  executionId: string,
  updates: Partial<RecipeExecution>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipe_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) {
      console.error('Error updating recipe execution:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating recipe execution:', error);
    return false;
  }
}

/**
 * Get recipe executions for a specific recipe
 */
export async function getRecipeExecutions(recipeId: string): Promise<RecipeExecution[]> {
  try {
    const { data, error } = await supabase
      .from('recipe_executions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipe executions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recipe executions:', error);
    return [];
  }
}