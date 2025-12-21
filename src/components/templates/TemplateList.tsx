
"use client";

import React from 'react';
import type { ContractTemplate } from '@/lib/contracts';
import { TemplateCard } from './TemplateCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Loader2 } from 'lucide-react';

interface TemplateListProps {
  templates: ContractTemplate[];
}

export default function TemplateList({ templates }: TemplateListProps) {

  if (!templates) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading Templates...</p>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>No Templates Available</AlertTitle>
        <AlertDescription>
          The public contract library is currently empty. New, pre-audited templates will be added soon. Administrators can add templates via the management panel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => {
              // Deployment functionality is removed for now.
              // This is where a new workflow will begin.
              console.log("Selected template:", template.name);
            }}
          />
        ))}
      </div>
    </>
  );
}
