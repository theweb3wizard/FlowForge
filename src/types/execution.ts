export type StepStatus = 'pending' | 'running' | 'success' | 'failed';

export type StepResult = {
  stepOrder: number;
  stepLabel: string;
  status: StepStatus;
  txHash: string | null;
  contractAddress: string | null;
  errorMessage: string | null;
  completedAt: string | null;
};

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'partial'
  | 'success'
  | 'failed';

export type Execution = {
  id: string;
  recipeId: string;
  userId: string;
  chainId: number;
  chainName: string;
  status: ExecutionStatus;
  stepResults: StepResult[];
  startedAt: string;
  completedAt: string | null;
};

export type CreateExecutionPayload = {
  recipeId: string;
  chainId: number;
  chainName: string;
};
