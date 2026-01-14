import { supabase, createAuthenticatedSupabaseClient } from '@/lib/supabase'; 
import { Recipe, RecipeExecution, CreateRecipePayload } from '@/types/recipe';
import { CreateTemplatePayload, ContractTemplate } from '@/types/template';

/**
 * Create a new recipe
 */
export async function createRecipe(payload: CreateRecipePayload): Promise<Recipe | null> {
  try {
    const authenticatedClient = await createAuthenticatedSupabaseClient(payload.creator_address);
    
    const { data, error } = await authenticatedClient
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
    // Use authenticated client if we have a creator address
    const client = creatorAddress 
      ? await createAuthenticatedSupabaseClient(creatorAddress)
      : supabase;
    
    let query = client.from('recipes').select('*').order('created_at', { ascending: false });

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
 * Update an existing recipe
 */
export async function updateRecipe(
  recipeId: string,
  updates: Partial<Pick<Recipe, 'name' | 'description' | 'steps' | 'is_public' | 'tags'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (error) {
      console.error('Error updating recipe:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating recipe:', error);
    return false;
  }
}

/**
 * Delete a recipe - NOW WITH EXECUTION HISTORY CHECK
 * Prevents deletion if the recipe has been executed before (data integrity)
 */
export async function deleteRecipe(recipeId: string, creatorAddress: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authenticatedClient = await createAuthenticatedSupabaseClient(creatorAddress);

    // Step 1: Check for existing executions of this recipe
    const { count, error: countError } = await supabase
      .from('recipe_executions')
      .select('id', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    if (countError) {
      console.error('Error checking for recipe executions:', countError);
      return { success: false, error: 'Could not verify recipe execution history. Please try again.' };
    }

    // Step 2: If executions exist, prevent deletion
    const executionCount = count ?? 0;
    if (executionCount > 0) {
      const errorMsg = `Cannot delete recipe. It has been executed ${executionCount} time${executionCount > 1 ? 's' : ''}. Recipes with execution history cannot be deleted to preserve data integrity.`;
      return { success: false, error: errorMsg };
    }

    // Step 3: If no executions, proceed with deletion
    const { error: deleteError } = await authenticatedClient
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (deleteError) {
      console.error('Error deleting recipe:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
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
    const authenticatedClient = await createAuthenticatedSupabaseClient(executorAddress);
    const { data, error } = await authenticatedClient
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


// User Template Functions

/**
 * Create a new user-defined template
 * NOW PROPERLY AUTHENTICATED with server-signed JWT!
 */
export async function createUserTemplate(payload: CreateTemplatePayload): Promise<ContractTemplate | null> {
    // Create an authenticated client with server-signed JWT
    const authenticatedClient = await createAuthenticatedSupabaseClient(payload.creator_address);
    
    const { data, error } = await authenticatedClient
        .from('user_contract_templates')
        .insert({
            ...payload,
            creator_address: payload.creator_address.toLowerCase(),
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating user template:', error);
        throw new Error(error.message);
    }
    
    return data as ContractTemplate;
}

/**
 * Get all templates for a specific user
 */
export async function getUserTemplates(creatorAddress: string): Promise<ContractTemplate[]> {
    const authenticatedClient = await createAuthenticatedSupabaseClient(creatorAddress);
    
    const { data, error } = await authenticatedClient
        .from('user_contract_templates')
        .select('*')
        .eq('creator_address', creatorAddress.toLowerCase())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user templates:', error);
        throw new Error(error.message);
    }

    return (data as ContractTemplate[]) || [];
}

/**
 * Delete a user-defined template, checking for existing deployments first.
 */
export async function deleteUserTemplate(templateId: string, creatorAddress: string): Promise<{ success: boolean; error?: string }> {
    const authenticatedClient = await createAuthenticatedSupabaseClient(creatorAddress);

    // Step 1: Check for existing deployments using this template.
    const { count, error: countError } = await supabase
        .from('deployments')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', templateId);

    if (countError) {
        console.error('Error checking for deployments:', countError);
        return { success: false, error: 'Could not verify template usage. Please try again.' };
    }

    // Step 2: If deployments exist, prevent deletion.
    const deploymentCount = count ?? 0;
    if (deploymentCount > 0) {
        const errorMsg = `Cannot delete template. It is used by ${deploymentCount} deployment${deploymentCount > 1 ? 's' : ''}.`;
        return { success: false, error: errorMsg };
    }

    // Step 3: If no deployments, proceed with deletion.
    const { error: deleteError } = await authenticatedClient
        .from('user_contract_templates')
        .delete()
        .eq('id', templateId)
        .eq('creator_address', creatorAddress.toLowerCase());

    if (deleteError) {
        console.error('Error deleting user template:', deleteError);
        return { success: false, error: deleteError.message };
    }

    return { success: true };
}