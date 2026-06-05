import type { ParsedAbi } from '@/types/abi';

export type StepParamConfig = {
  name: string;
  type: string;
  value: string;
  isVariable: boolean;
  variableRef: string | null;
};

export type StepType = 'deploy' | 'interact';

export type RecipeStep = {
  id: string;
  recipeId: string;
  stepOrder: number;
  stepType: StepType;
  label: string;
  contractName: string | null;
  abi: ParsedAbi;
  bytecode: string | null;
  targetAddress: string | null;
  functionName: string | null;
  constructorParams: StepParamConfig[];
};

export type Recipe = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: RecipeStep[];
};

export type RecipeWithSteps = Recipe & { steps: RecipeStep[] };

export type CreateRecipePayload = {
  name: string;
  description?: string;
};

export type UpdateRecipePayload = Partial<
  Pick<Recipe, 'name' | 'description' | 'isPublic'>
>;

export type UpsertStepPayload = Omit<RecipeStep, 'id'> & { id?: string };
