'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getWriteFunctions } from '@/lib/abi/parser';
import type { ParsedAbi } from '@/types/abi';

type FunctionSelectorProps = {
  abi: ParsedAbi;
  value: string | null;
  onFunctionSelected: (functionName: string) => void;
};

export function FunctionSelector({
  abi,
  value,
  onFunctionSelected,
}: FunctionSelectorProps) {
  const writeFunctions = getWriteFunctions(abi);
  const hasAbi = abi.length > 0;

  return (
    <Select
      value={value ?? ''}
      onValueChange={onFunctionSelected}
      disabled={!hasAbi || writeFunctions.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            !hasAbi
              ? 'Upload an ABI first'
              : writeFunctions.length === 0
              ? 'No writable functions found'
              : 'Select a function'
          }
        />
      </SelectTrigger>
      <SelectContent>
        {writeFunctions.map((fn) => (
          <SelectItem key={fn.name} value={fn.name}>
            {fn.name}{' '}
            <span className="text-muted-foreground">
              ({fn.inputs.length} {fn.inputs.length === 1 ? 'param' : 'params'})
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
