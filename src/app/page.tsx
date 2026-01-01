'use client';

import { useState } from 'react';
import { ContractTemplate } from '@/types/template';
import { useTemplates } from '@/hooks/use-queries';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { DeploymentModal } from '@/components/deployment/DeploymentModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database } from 'lucide-react';
import { TemplateCardSkeleton } from '@/components/common/LoadingSkeleton';
import { BatchCart } from '@/components/batch/BatchCart';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const { data: templates = [], isLoading } = useTemplates();

  const handleSelect = (template: ContractTemplate) => {
    if (template.status === 'active') {
      setSelectedTemplate(template);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Forge Your Path on the BlockDAG
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Effortlessly deploy secure, pre-audited smart contracts to the testnet. No code, no hassle—just pure innovation.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Forge Your Path on the BlockDAG
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Effortlessly deploy secure, pre-audited smart contracts to the testnet. No code, no hassle—just pure innovation.
        </p>
      </header>
      
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>No Templates Available</AlertTitle>
            <AlertDescription>
                The public contract library is currently empty. New, pre-audited templates will be added soon. Administrators can add templates via the management panel.
            </AlertDescription>
        </Alert>
      )}
    </div>

    {selectedTemplate && (
        <DeploymentModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
        />
    )}
     <BatchCart />
    </>
  );
}
