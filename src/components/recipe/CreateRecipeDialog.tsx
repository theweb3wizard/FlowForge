'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { createRecipe } from '@/lib/supabase/recipes';

const createRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100),
  description: z.string().max(500).optional(),
});

type CreateRecipeFormValues = z.infer<typeof createRecipeSchema>;

type CreateRecipeDialogProps = {
  trigger?: React.ReactNode;
};

export function CreateRecipeDialog({ trigger }: CreateRecipeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateRecipeFormValues>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: CreateRecipeFormValues) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        form.setError('name', { message: 'You must be signed in to create a recipe.' });
        return;
      }

      const { data, error } = await createRecipe(supabase, user.id, {
        name: values.name,
        description: values.description || undefined,
      });

      if (error || !data) {
        form.setError('name', {
          message: error ?? 'Failed to create recipe. Please try again.',
        });
        return;
      }

      setOpen(false);
      form.reset();
      router.push(`/recipe/${data.id}/builder`);
      router.refresh();
    } catch (submitError) {
      console.error('Create recipe failed:', submitError);
      form.setError('name', {
        message: 'Failed to create recipe. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>New Recipe</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Recipe</DialogTitle>
          <DialogDescription>
            Name your deployment workflow. You can add steps on the next screen.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Token + Staking Deploy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deploy token, staking contract, and grant roles."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Recipe'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
