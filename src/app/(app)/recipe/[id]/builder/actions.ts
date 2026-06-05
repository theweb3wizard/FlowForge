'use server';
// Server Actions for the recipe builder page.
// Re-exported from the shared lib so components can import without
// dynamic [id] path segments causing TS resolution issues.
export {
  saveRecipeAction,
  togglePublicAction,
  cloneRecipeAction,
} from '@/lib/actions/recipeActions';
