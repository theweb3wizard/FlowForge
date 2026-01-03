'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUserTemplate } from '@/hooks/use-queries';
import { useWallet } from '@/contexts/WalletContext';
import { parseConstructor } from '@/lib/abi/parser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { CreateTemplatePayload } from '@/types/template';

const schema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  abi: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  }, { message: 'ABI must be a valid JSON array' }),
  bytecode: z.string().refine((val) => /^0x[0-9a-fA-F]+$/.test(val), {
    message: 'Bytecode must be a valid hex string (starting with 0x)',
  }),
});

type FormData = z.infer<typeof schema>;

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
}

export function CreateTemplateModal({ isOpen, onClose, onTemplateCreated }: CreateTemplateModalProps) {
  const { address } = useWallet();
  const { mutate: createTemplate, isPending } = useCreateUserTemplate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleSave = (formData: FormData) => {
    // Step 1: Check wallet connection
    if (!address) {
      toast.error('Authentication required', {
        description: 'Please connect your wallet to create a template',
      });
      return;
    }
    
    try {
      // Step 2: Parse the ABI
      let parsedAbi;
      try {
        parsedAbi = JSON.parse(formData.abi);
      } catch (parseError) {
        toast.error('Invalid ABI format', {
          description: 'The ABI must be valid JSON. Please check your formatting.',
        });
        return;
      }

      // Step 3: Extract constructor parameters using parseConstructor
      let constructor;
      try {
        constructor = parseConstructor(parsedAbi);
      } catch (constructorError) {
        toast.error('Failed to parse constructor', {
          description: 'Could not extract constructor from ABI. Ensure it\'s a valid contract ABI.',
        });
        return;
      }

      // Step 4: Map constructor inputs to the parameters format expected by the database
      const parameters = constructor.inputs.map(input => ({
        name: input.name || 'unnamed',
        type: input.type,
        description: input.name ? `Parameter for ${input.name}` : 'Constructor parameter',
        required: true,
      }));

      // Step 5: Create the complete payload with properly formatted parameters
      const payload: CreateTemplatePayload = {
        creator_address: address,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        icon: formData.icon?.trim() || 'FileCode',
        abi: parsedAbi,
        bytecode: formData.bytecode.trim(),
        parameters: parameters,
      };

      // Step 6: Call the creation function with enhanced error handling
      createTemplate(payload, {
        onSuccess: () => {
          toast.success('Template created successfully!', {
            description: `"${formData.name}" is now available in your templates`,
          });
          reset();
          onTemplateCreated();
        },
        onError: (error: Error) => {
          // Provide specific error messages based on the error type
          const errorMessage = error.message.toLowerCase();
          
          if (errorMessage.includes('row-level security') || errorMessage.includes('rls')) {
            toast.error('Authentication failed', {
              description: 'Your wallet authentication failed. Please reconnect your wallet and try again.',
            });
          } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
            toast.error('Template already exists', {
              description: 'A template with this name already exists. Please use a different name.',
            });
          } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
            toast.error('Invalid template data', {
              description: 'One or more fields contain invalid data. Please check your inputs.',
            });
          } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            toast.error('Connection error', {
              description: 'Could not connect to the database. Please check your internet connection.',
            });
          } else {
            // Generic error with the actual message
            toast.error('Failed to create template', {
              description: error.message || 'An unexpected error occurred. Please try again.',
            });
          }
        }
      });
    } catch (unexpectedError) {
      // Catch any unexpected errors
      console.error('Unexpected error in handleSave:', unexpectedError);
      toast.error('Unexpected error', {
        description: 'An unexpected error occurred. Please try again or contact support.',
      });
    }
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Add your own smart contract ABI and bytecode to create a private, reusable template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input id="name" {...register('name')} disabled={isPending} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Emoji or Lucide Icon Name)</Label>
            <Input id="icon" {...register('icon')} placeholder="e.g., '🚀' or 'Rocket'" disabled={isPending}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abi">ABI (JSON Array) *</Label>
            <Textarea id="abi" {...register('abi')} rows={6} placeholder='[{"inputs":...}]' disabled={isPending}/>
            {errors.abi && <p className="text-sm text-destructive">{errors.abi.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bytecode">Bytecode (Hex) *</Label>
            <Textarea id="bytecode" {...register('bytecode')} rows={4} placeholder='0x...' disabled={isPending}/>
            {errors.bytecode && <p className="text-sm text-destructive">{errors.bytecode.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
