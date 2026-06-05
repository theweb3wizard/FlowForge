'use client';

import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariablePicker } from '@/components/builder/VariablePicker';
import type { StepParamConfig } from '@/types/recipe';

type VariableOption = {
  label: string;
  value: string;
};

type ParamConfiguratorProps = {
  params: StepParamConfig[];
  onChange: (index: number, updates: Partial<StepParamConfig>) => void;
  availableVariables: VariableOption[];
};

export function ParamConfigurator({
  params,
  onChange,
  availableVariables,
}: ParamConfiguratorProps) {
  if (params.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {params.map((param, index) => (
        <div key={`${param.name}-${index}`} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{param.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {param.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`use-variable-${index}`}
                className="text-xs text-muted-foreground"
              >
                Use Variable
              </Label>
              <Switch
                id={`use-variable-${index}`}
                checked={param.isVariable}
                onCheckedChange={(checked) => {
                  onChange(index, {
                    isVariable: checked,
                    value: checked ? '' : param.value,
                    variableRef: checked ? param.variableRef : null,
                  });
                }}
              />
            </div>
          </div>

          {param.isVariable ? (
            <VariablePicker
              value={param.variableRef}
              onChange={(val) => onChange(index, { variableRef: val })}
              availableVariables={availableVariables}
            />
          ) : (
            <Input
              value={param.value}
              onChange={(e) => onChange(index, { value: e.target.value })}
              placeholder={`Enter ${param.type} value`}
              className="font-mono text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}
