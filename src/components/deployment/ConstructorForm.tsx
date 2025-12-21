'use client';

import { useState, useEffect } from 'react';
import { ContractTemplate } from '@/types/template';
import { parseConstructor } from '@/lib/abi/parser';
import { getInputType, getPlaceholder, validateInput } from '@/lib/abi/parser';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConstructorFormProps {
  template: ContractTemplate;
  onArgsChange: (args: any[]) => void;
  onValidChange: (isValid: boolean) => void;
}

export function ConstructorForm({ template, onArgsChange, onValidChange }: ConstructorFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const constructor = parseConstructor(template.abi);
  const constructorInputs = Array.isArray(constructor.inputs) ? constructor.inputs : [];

  // Initialize form values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    constructorInputs.forEach((param) => {
      initialValues[param.name] = '';
    });
    setFormValues(initialValues);
    onValidChange(!constructor.hasConstructor || constructorInputs.length === 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, constructor.hasConstructor, JSON.stringify(constructorInputs)]);

  // Validate and emit changes
  useEffect(() => {
    if (constructorInputs.length === 0) {
      onArgsChange([]);
      onValidChange(true);
      return;
    }
    const args = constructorInputs.map((param) => formValues[param.name]);
    const allFilled = constructorInputs.every((param) => {
      const value = formValues[param.name];
      return value !== '' && value !== null && value !== undefined;
    });

    const hasErrors = Object.keys(errors).length > 0;
    
    onArgsChange(args);
    onValidChange(allFilled && !hasErrors);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, errors, JSON.stringify(constructorInputs)]);

  const handleChange = (paramName: string, paramType: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [paramName]: value }));

    // Validate input
    if (value && !validateInput(value, paramType)) {
      setErrors((prev) => ({
        ...prev,
        [paramName]: `Invalid ${paramType} format`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  if (!constructor.hasConstructor || constructorInputs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
        This contract has no constructor parameters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {constructorInputs.map((param, index) => {
        const inputType = getInputType(param.type);
        const placeholder = getPlaceholder(param);
        const error = errors[param.name];

        return (
          <div key={index} className="space-y-2">
            <Label htmlFor={param.name} className="flex items-center">
              {param.name}
              <span className="text-xs text-muted-foreground ml-2">({param.type})</span>
              <span className="text-destructive ml-1">*</span>
            </Label>

            {inputType === 'textarea' ? (
              <Textarea
                id={param.name}
                placeholder={placeholder}
                value={formValues[param.name] || ''}
                onChange={(e) => handleChange(param.name, param.type, e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            ) : inputType === 'checkbox' ? (
              <select
                id={param.name}
                value={formValues[param.name] || ''}
                onChange={(e) => handleChange(param.name, param.type, e.target.value)}
                className={`w-full h-10 px-3 py-2 border rounded-md text-sm bg-background ${error ? 'border-destructive' : 'border-input'}`}
              >
                <option value="">Select...</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <Input
                id={param.name}
                type={inputType}
                placeholder={placeholder}
                value={formValues[param.name] || ''}
                onChange={(e) => handleChange(param.name, param.type, e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            )}

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
