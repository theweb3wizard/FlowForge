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
import { Save } from 'lucide-react';
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
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
        const parsedAbi = JSON.parse(formData.abi);
        const constructor = parseConstructor(parsedAbi);
        const parameters = constructor.inputs.map(input => ({
            name: input.name,
            type: input.type,
            description: `Parameter for ${input.name}`,
            required: true,
        }));

        const payload: CreateTemplatePayload = {
            creator_address: address,
            name: formData.name,
            description: formData.description || '',
            icon: formData.icon || 'FileCode',
            abi: parsedAbi,
            bytecode: formData.bytecode,
            parameters: parameters,
        };

        createTemplate(payload, {
            onSuccess: () => {
                toast.success('Template created successfully!');
                onTemplateCreated();
                reset();
            },
            onError: (error) => {
                toast.error('Failed to create template', {
                    description: error.message,
                });
            }
        });
    } catch (e) {
        toast.error('Invalid ABI format');
    }
  };

  const handleClose = () => {
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
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Emoji or Lucide Icon Name)</Label>
            <Input id="icon" {...register('icon')} placeholder="e.g., '🚀' or 'Rocket'"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abi">ABI (JSON Array) *</Label>
            <Textarea id="abi" {...register('abi')} rows={6} placeholder='[{"inputs":...}]'/>
            {errors.abi && <p className="text-sm text-destructive">{errors.abi.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bytecode">Bytecode (Hex) *</Label>
            <Textarea id="bytecode" {...register('bytecode')} rows={4} placeholder='0x...'/>
            {errors.bytecode && <p className="text-sm text-destructive">{errors.bytecode.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
