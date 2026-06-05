'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type VariableOption = {
  label: string;
  value: string;
};

type VariablePickerProps = {
  value: string | null;
  onChange: (value: string) => void;
  availableVariables: VariableOption[];
};

export function VariablePicker({
  value,
  onChange,
  availableVariables,
}: VariablePickerProps) {
  const isEmpty = availableVariables.length === 0;

  return (
    <Select
      value={value ?? ''}
      onValueChange={onChange}
      disabled={isEmpty}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            isEmpty
              ? 'No previous steps available'
              : 'Select a previous step\'s output'
          }
        />
      </SelectTrigger>
      <SelectContent>
        {availableVariables.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
