"use client";

import React, { useState } from 'react';
import { CONTRACT_TEMPLATES, type ContractTemplate } from '@/lib/contracts';
import { TemplateCard } from './TemplateCard';
import { DeploymentWizard } from '../deployment/DeploymentWizard';

export default function TemplateList() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {CONTRACT_TEMPLATES.map((template) => (
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
