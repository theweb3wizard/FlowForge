'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { ContractTemplate } from '@/types/template';
import { useBatch } from '@/contexts/BatchContext';
import { ShoppingCart, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateCardProps {
  template: ContractTemplate;
  onSelect: (template: ContractTemplate) => void;
  className?: string;
}

export function TemplateCard({ template, onSelect, className }: TemplateCardProps) {
  const Icon =
    LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.FileCode;

  const isDisabled = template.status !== 'active';

  const { addToBatch } = useBatch(); // ← THIS was missing

  return (
    <Card
      className={cn(
        'flex flex-col h-full transition-transform transform hover:-translate-y-1 hover:shadow-lg',
        className
      )}
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className="bg-secondary p-3 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">
            {template.name}
          </CardTitle>
          <CardDescription className="line-clamp-3 mt-1">
            {template.description}
          </CardDescription>
        </div>
        {template.status !== 'active' && (
          <Badge variant="outline">{template.status}</Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1" />

      <CardFooter>
        {isDisabled ? (
          <Button disabled className="w-full">
            Coming Soon
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => onSelect(template)}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Deploy Now
            </Button>

            <Button
              onClick={() => {
                addToBatch(template);
                toast.success('Added to batch!', {
                  description: `${template.name} added to deployment queue`,
                });
              }}
              variant="outline"
              size="icon"
              title="Add to batch deployment"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
