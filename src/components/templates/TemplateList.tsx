
"use client";

import React, { useState } from 'react';
import type { ContractTemplate } from '@/lib/contracts';
import { TemplateCard } from './TemplateCard';
import { DeploymentWizard } from '../deployment/DeploymentWizard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Loader2 } from 'lucide-react';

interface TemplateListProps {
  templates: ContractTemplate[];
}

export default function TemplateList({ templates }: TemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

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
            <AlertTitle>No Templates Found</AlertTitle>
            <AlertDescription>
                There are currently no contract templates available. Please check back later or add new templates to the database.
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
              if (template.status === 'live') {
                setSelectedTemplate(template);
              }
            }}
          />
        ))}
      </div>
      {selectedTemplate && (
        <DeploymentWizard
          template={selectedTemplate}
          open={!!selectedTemplate}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedTemplate(null);
            }
          }}
        />
      )}
    </>
  );
}
