'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AbiUploader } from '@/components/builder/AbiUploader';
import { ParamConfigurator } from '@/components/builder/ParamConfigurator';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';
import {
  buildDefaultParams,
  getConstructorInputs,
} from '@/lib/abi/parser';
import { getAvailableVariables } from '@/utils/resolveStepParam';
import type { ParsedAbi } from '@/types/abi';
import { useState } from 'react';

type DeployStepConfigProps = {
  stepId: string;
};

export function DeployStepConfig({ stepId }: DeployStepConfigProps) {
  const steps = useRecipeBuilderStore((s) => s.steps);
  const getStepsBeforeSelected = useRecipeBuilderStore((s) => s.getStepsBeforeSelected);
  const updateStepField = useRecipeBuilderStore((s) => s.updateStepField);
  const updateStepParam = useRecipeBuilderStore((s) => s.updateStepParam);

  const step = steps.find((s) => s.id === stepId);
  const [bytecodeError, setBytecodeError] = useState<string | null>(null);

  if (!step) return null;

  const stepsBeforeSelected = getStepsBeforeSelected();
  const availableVariables = getAvailableVariables(
    stepsBeforeSelected,
    step.stepOrder,
  );

  const handleAbiParsed = (abi: ParsedAbi) => {
    updateStepField(stepId, 'abi', abi);
    // Rebuild constructor params from the new ABI — clears previous values
    const newParams = buildDefaultParams(getConstructorInputs(abi));
    updateStepField(stepId, 'constructorParams', newParams);
  };

  const handleBytecodeChange = (value: string) => {
    if (value && !value.startsWith('0x')) {
      setBytecodeError('Bytecode must start with 0x');
    } else {
      setBytecodeError(null);
    }
    updateStepField(stepId, 'bytecode', value || null);
  };

  const constructorInputs = getConstructorInputs(step.abi);
  const hasAbi = step.abi.length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Deploy Step</h2>
        <p className="text-sm text-muted-foreground">
          Configure contract deployment for Step {step.stepOrder + 1}
        </p>
      </div>

      <Separator />

      {/* Step Label */}
      <div className="space-y-2">
        <Label htmlFor={`label-${stepId}`}>Step Label</Label>
        <Input
          id={`label-${stepId}`}
          value={step.label}
          onChange={(e) => updateStepField(stepId, 'label', e.target.value)}
          placeholder="e.g. Deploy Token Contract"
        />
      </div>

      {/* Contract Name */}
      <div className="space-y-2">
        <Label htmlFor={`contract-name-${stepId}`}>
          Contract Name{' '}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id={`contract-name-${stepId}`}
          value={step.contractName ?? ''}
          onChange={(e) =>
            updateStepField(stepId, 'contractName', e.target.value || null)
          }
          placeholder="e.g. MyToken"
        />
      </div>

      {/* ABI */}
      <div className="space-y-2">
        <Label>ABI</Label>
        <AbiUploader onAbiParsed={handleAbiParsed} currentAbi={step.abi} />
      </div>

      {/* Bytecode */}
      <div className="space-y-2">
        <Label htmlFor={`bytecode-${stepId}`}>Bytecode</Label>
        <Textarea
          id={`bytecode-${stepId}`}
          value={step.bytecode ?? ''}
          onChange={(e) => handleBytecodeChange(e.target.value)}
          placeholder="0x608060405234801561001057600080fd5b50..."
          rows={4}
          className="font-mono text-xs"
          spellCheck={false}
        />
        {bytecodeError ? (
          <p className="text-xs text-destructive">{bytecodeError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Paste the compiled contract bytecode (0x...)
          </p>
        )}
      </div>

      {/* Constructor Parameters */}
      <div className="space-y-3">
        <Label>Constructor Parameters</Label>
        {!hasAbi ? (
          <p className="text-sm text-muted-foreground">
            Upload an ABI to configure constructor parameters.
          </p>
        ) : constructorInputs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This contract has no constructor parameters.
          </p>
        ) : (
          <ParamConfigurator
            params={step.constructorParams}
            onChange={(index, updates) =>
              updateStepParam(stepId, index, updates)
            }
            availableVariables={availableVariables}
          />
        )}
      </div>
    </div>
  );
}
