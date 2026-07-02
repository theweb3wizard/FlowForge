'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteRecipe } from '@/lib/db/recipes';

type DeleteRecipeDialogProps = {
  recipeId: string;
  recipeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (recipeId: string) => void;
};

export function DeleteRecipeDialog({
  recipeId,
  recipeName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteRecipeDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error } = await deleteRecipe(recipeId);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Recipe deleted.');
      onOpenChange(false);
      onDeleted(recipeId);
      router.refresh();
    } catch (deleteError) {
      console.error('Delete recipe failed:', deleteError);
      toast.error('Failed to delete recipe. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &apos;{recipeName}&apos;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the recipe and all its execution
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Recipe'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
