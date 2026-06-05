import type { AbiInputParam, AbiFunction, ParsedAbi } from '@/types/abi';
import type { StepParamConfig } from '@/types/recipe';

export class AbiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbiParseError';
  }
}

function isAbiArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function parseAbi(raw: unknown): ParsedAbi {
  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AbiParseError('ABI must be valid JSON.');
    }
  }

  if (!isAbiArray(parsed)) {
    throw new AbiParseError('ABI must be a JSON array.');
  }

  return parsed as ParsedAbi;
}

export function getConstructorInputs(abi: ParsedAbi): AbiInputParam[] {
  const constructor = abi.find(
    (entry): entry is Extract<typeof entry, { type: 'constructor' }> =>
      entry.type === 'constructor',
  );

  if (!constructor) return [];
  // AbiConstructor has inputs, but AbiEntry union includes fallback/receive which don't
  if (!('inputs' in constructor)) return [];
  return constructor.inputs as AbiInputParam[];
}

export function getWriteFunctions(abi: ParsedAbi): AbiFunction[] {
  return abi.filter((entry): entry is AbiFunction => {
    if (entry.type !== 'function') return false;
    const fn = entry as AbiFunction;
    return fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable';
  });
}

export function getFunctionByName(
  abi: ParsedAbi,
  name: string,
): AbiFunction | undefined {
  return getWriteFunctions(abi).find((fn) => fn.name === name);
}

export function buildDefaultParams(inputs: AbiInputParam[]): StepParamConfig[] {
  return inputs.map((input) => ({
    name: input.name,
    type: input.type,
    value: '',
    isVariable: false,
    variableRef: null,
  }));
}

export function isValidAbiJson(input: string): boolean {
  try {
    const parsed: unknown = JSON.parse(input);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}
