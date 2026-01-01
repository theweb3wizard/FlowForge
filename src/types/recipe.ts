import { ContractTemplate } from './template';

export type StepType = 'deploy' | 'interact';

export interface DeployStep {
  type: 'deploy';
  templateId: string;
  contractName: string;
  constructorArgs: ConstructorArg[];
}

export interface InteractStep {
  type: 'interact';
  // A reference to the contract to interact with.
  // Can be a static address or a reference to a previous step's output.
  contractSource: string | VariableReference;
  functionName: string;
  functionArgs: FunctionArg[];
  isWrite: boolean;
}

export type RecipeStep = DeployStep | InteractStep;

export interface ConstructorArg {
  name: string;
  type: string;
  value: string | VariableReference;
}

export interface FunctionArg {
  name: string;
  type: string;
  value: string | VariableReference;
}

export interface VariableReference {
  source: 'step'; // Reference output from previous step
  stepIndex: number;
  property: 'contractAddress' | 'transactionHash' | 'result'; // The output property to use
}

export interface Recipe {
  id: string;
  name:string;
  description: string;
  creator_address: string;
  steps: RecipeStep[];
  network?: string;
  is_public: boolean;
  tags: string[];
  execution_count: number;
  created_at: string;
  updated_at: string;
}

export interface StepResult {
  stepIndex: number;
  status: 'pending' | 'running' | 'success' | 'error';
  contractAddress?: string;
  transactionHash?: string;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RecipeExecution {
  id: string;
  recipe_id: string;
  executor_address: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  current_step: number;
  total_steps: number;
  step_results: StepResult[];
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface CreateRecipePayload {
  name: string;
  description: string;
  creator_address: string;
  steps: RecipeStep[];
  network?: string;
  is_public?: boolean;
  tags?: string[];
}
