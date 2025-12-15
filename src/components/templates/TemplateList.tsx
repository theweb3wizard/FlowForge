
"use client";

import React, { useState, useEffect } from 'react';
import { CONTRACT_TEMPLATES, type ContractTemplate } from '@/lib/contracts';
import { TemplateCard } from './TemplateCard';
import { DeploymentWizard } from '../deployment/DeploymentWizard';
import { Skeleton } from '../ui/skeleton';
import { erc20Abi, erc20Bytecode } from '@/lib/abis/erc20';

// This component simulates fetching dynamic contract data.
// In a real data-driven system, this would be a fetch call to a database.
const useHydratedTemplates = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching and hydrating templates with their ABI/bytecode
    const hydrated = CONTRACT_TEMPLATES.map(t => {
      if (t.id === 'erc20') {
        return { ...t, abi: erc20Abi, bytecode: erc20Bytecode };
      }
      // In a real app, you'd fetch this data from your DB
      return { ...t, abi: [], bytecode: '0x' };
    }) as ContractTemplate[];
    
    setTemplates(hydrated);
    setLoading(false);
  }, []);

  return { templates, loading };
};


export default function TemplateList() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const { templates, loading } = useHydratedTemplates();

  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[250px] w-full" />
            ))}
        </div>
    );
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
