'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AbiUploader } from '@/components/builder/AbiUploader';
import { FunctionSelector } from '@/components/builder/FunctionSelector';
import { ParamConfigurator } from '@/components/builder/ParamConfigurator';
import { VariablePicker } from '@/components/builder/VariablePicker';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';
import {
  buildDefaultParams,
  getFunctionByName,
} from '@/lib/abi/parser';
import { getAvailableVariables } from '@/utils/resolveStepParam';
import { isAddress } from '@/utils/formatAddress';
import type { ParsedAbi } from '@/types/abi';

type InteractStepConfigProps = {
  stepId: string;
};

export function InteractStepConfig({ stepId }: InteractStepConfigProps) {
  const steps = useRecipeBuilderStore((s) => s.steps);
  const getStepsBeforeSelected = useRecipeBuilderStore((s) => s.getStepsBeforeSelected);
  const updateStepField = useRecipeBuilderStore((s) => s.updateStepField);
  const updateStepParam = useRecipeBuilderStore((s) => s.updateStepParam);

  const step = steps.find((s) => s.id === stepId);

  const [addressError, setAddressError] = useState<string | null>(null);

  if (!step) return null;

  const stepsBeforeSelected = getStepsBeforeSelected();
  const availableVariables = getAvailableVariables(
    stepsBeforeSelected,
    step.stepOrder,
  );

  // Determine if the current targetAddress is a variable ref or a fixed address
  const isUsingVariable =
    !!step.targetAddress && step.targetAddress.startsWith('${');

  const handleToggleAddressMode = (useVariable: boolean) => {
    setAddressError(null);
    if (useVariable) {
      // Switch to variable mode — clear fixed address
      updateStepField(stepId, 'targetAddress', null);
    } else {
      // Switch to fixed address mode — clear variable ref
      updateStepField(stepId, 'targetAddress', null);
    }
  };

  const handleFixedAddressChange = (value: string) => {
    if (value && !isAddress(value)) {
      setAddressError('Must be a valid 0x Ethereum address');
    } else {
      setAddressError(null);
    }
    updateStepField(stepId, 'targetAddress', value || null);
  };

  const handleVariableRefChange = (variableRef: string) => {
    // Store variable refs wrapped in ${} for the resolveTargetAddress utility
    updateStepField(stepId, 'targetAddress', `\${${variableRef}}`);
  };

  // Filter available variables to only contractAddress options for target address
  const contractAddressVariables = availableVariables.filter((v) =>
    v.value.endsWith('.contractAddress'),
  );

  const handleAbiParsed = (abi: ParsedAbi) => {
    updateStepField(stepId, 'abi', abi);
    // Clear function and params when ABI changes
    updateStepField(stepId, 'functionName', null);
    updateStepField(stepId, 'constructorParams', []);
  };

  const handleFunctionSelected = (functionName: string) => {
    updateStepField(stepId, 'functionName', functionName);
    // Rebuild params from the selected function's inputs
    const fn = getFunctionByName(step.abi, functionName);
    const newParams = buildDefaultParams(fn?.inputs ?? []);
    updateStepField(stepId, 'constructorParams', newParams);
  };

  const hasAbi = step.abi.length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Interact Step</h2>
        <p className="text-sm text-muted-foreground">
          Configure a contract function call for Step {step.stepOrder + 1}
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
          placeholder="e.g. Grant Minter Role"
        />
      </div>

      {/* Target Contract Address */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Target Contract Address</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Use step output
            </span>
            <Switch
              checked={isUsingVariable}
              onCheckedChange={handleToggleAddressMode}
              aria-label="Toggle between fixed address and variable reference"
            />
          </div>
        </div>

        {isUsingVariable ? (
          <VariablePicker
            value={
              step.targetAddress
                ? step.targetAddress.replace(/^\$\{(.+)\}$/, '$1')
                : null
            }
            onChange={handleVariableRefChange}
            availableVariables={contractAddressVariables}
          />
        ) : (
          <>
            <Input
              value={step.targetAddress ?? ''}
              onChange={(e) => handleFixedAddressChange(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
            {addressError && (
              <p className="text-xs text-destructive">{addressError}</p>
            )}
          </>
        )}
      </div>

      {/* ABI */}
      <div className="space-y-2">
        <Label>ABI</Label>
        <AbiUploader onAbiParsed={handleAbiParsed} currentAbi={step.abi} />
      </div>

      {/* Function Selector */}
      <div className="space-y-2">
        <Label>Function</Label>
        <FunctionSelector
          abi={step.abi}
          value={step.functionName}
          onFunctionSelected={handleFunctionSelected}
        />
        {hasAbi && step.functionName && (
          <p className="text-xs text-muted-foreground">
            Selected: <span className="font-mono">{step.functionName}</span>
          </p>
        )}
      </div>

      {/* Function Parameters */}
      {step.functionName && step.constructorParams.length > 0 && (
        <div className="space-y-3">
          <Label>Function Parameters</Label>
          <ParamConfigurator
            params={step.constructorParams}
            onChange={(index, updates) =>
              updateStepParam(stepId, index, updates)
            }
            availableVariables={availableVariables}
          />
        </div>
      )}

      {step.functionName && step.constructorParams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          This function has no parameters.
        </p>
      )}
    </div>
  );
}
