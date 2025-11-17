import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type ContractTemplate } from '@/lib/contracts';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TemplateCardProps {
  template: ContractTemplate;
  onSelect: () => void;
  className?: string;
}

export function TemplateCard({ template, onSelect, className }: TemplateCardProps) {
  const Icon = LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.FileCode;
  const isDisabled = template.status === 'soon';

  return (
    <Card className={cn("flex flex-col h-full transition-transform transform hover:-translate-y-1 hover:shadow-lg", className)}>
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className="bg-secondary p-3 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{template.name}</CardTitle>
          <CardDescription className="line-clamp-3 mt-1">
            {template.description}
          </CardDescription>
        </div>
        {isDisabled && <Badge variant="outline">Coming Soon</Badge>}
      </CardHeader>
      <CardContent className="flex-1" />
      <CardFooter>
        <Button 
          onClick={onSelect} 
          disabled={isDisabled}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground hover:shadow-glow-accent transition-shadow duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          {isDisabled ? 'Coming Soon' : 'Deploy Now'}
          {!isDisabled && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
