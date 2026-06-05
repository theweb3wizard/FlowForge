import type { StepResult } from '@/types/execution';
import type { RecipeStep, StepParamConfig } from '@/types/recipe';
import { isAddress } from '@/utils/formatAddress';

type VariableOption = {
  label: string;
  value: string;
};

function parseVariableRef(
  variableRef: string,
): { stepOrder: number; field: string } {
  const match = /^step_(\d+)\.(\w+)$/.exec(variableRef);

  if (!match) {
    throw new Error(
      `Invalid variable reference "${variableRef}". Expected format: step_{N}.contractAddress or step_{N}.txHash`,
    );
  }

  return {
    stepOrder: Number.parseInt(match[1], 10),
    field: match[2],
  };
}

export function resolveStepParam(
  param: StepParamConfig,
  completedResults: StepResult[],
): string {
  if (!param.isVariable) {
    return param.value;
  }

  if (param.variableRef === null) {
    throw new Error(`Variable reference not set for param "${param.name}"`);
  }

  const { stepOrder, field } = parseVariableRef(param.variableRef);

  const completedResult = completedResults.find(
    (result) => result.stepOrder === stepOrder && result.status === 'success',
  );

  if (!completedResult) {
    throw new Error(
      `Step ${stepOrder} has not completed successfully. Cannot resolve variable reference.`,
    );
  }

  if (field === 'contractAddress') {
    if (completedResult.contractAddress === null) {
      throw new Error(
        `Step ${stepOrder} did not produce a contract address.`,
      );
    }
    return completedResult.contractAddress;
  }

  if (field === 'txHash') {
    if (completedResult.txHash === null) {
      throw new Error(`Step ${stepOrder} did not produce a transaction hash.`);
    }
    return completedResult.txHash;
  }

  throw new Error(
    `Unknown variable field "${field}". Supported fields: contractAddress, txHash.`,
  );
}

export function getAvailableVariables(
  allSteps: RecipeStep[],
  currentStepOrder: number,
): VariableOption[] {
  const options: VariableOption[] = [];

  for (const step of allSteps) {
    if (step.stepOrder >= currentStepOrder) {
      continue;
    }

    const displayStepNumber = step.stepOrder + 1;

    if (step.stepType === 'deploy') {
      options.push({
        label: `Step ${displayStepNumber}: ${step.label} → contractAddress`,
        value: `step_${step.stepOrder}.contractAddress`,
      });
    }

    options.push({
      label: `Step ${displayStepNumber}: ${step.label} → txHash`,
      value: `step_${step.stepOrder}.txHash`,
    });
  }

  return options;
}

export function resolveTargetAddress(
  targetAddress: string,
  completedResults: StepResult[],
): string {
  if (isAddress(targetAddress)) {
    return targetAddress;
  }

  const variableRef = targetAddress.replace(/^\$\{(.+)\}$/, '$1');

  return resolveStepParam(
    {
      name: 'targetAddress',
      type: 'address',
      value: '',
      isVariable: true,
      variableRef,
    },
    completedResults,
  );
}
