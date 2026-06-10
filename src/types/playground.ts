export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecurityFinding = {
  severity: SecuritySeverity;
  line: number;
  title: string;
  description: string;
  recommendation: string;
};

export type CompileError = {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  formattedMessage?: string;
};

export type ContractOutput = {
  file: string;
  name: string;
  abi?: unknown[];
  bytecode?: string;
};

export type CompileResult = {
  success: boolean;
  abi?: unknown[];
  bytecode?: string;
  errors: CompileError[];
  warnings: CompileError[];
  contractName?: string;
  allContracts?: ContractOutput[];
};

export type PlaygroundTab = 'generate' | 'interact' | 'deploy';

export type GenerationLogEntry = {
  id: string;
  userId: string | null;
  anonToken: string | null;
  prompt: string;
  generatedAt: string;
  tokensUsed: number | null;
  modelUsed: string;
  compilationSuccess: boolean | null;
  securityFlags: SecurityFinding[];
};

export type DeployRecord = {
  id: string;
  userId: string;
  recipeId: string | null;
  network: string;
  contractAddress: string;
  transactionHash: string;
  deployerAddress: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
};

export type PlaygroundState = {
  code: string;
  isGenerating: boolean;
  isCompiling: boolean;
  compileResult: CompileResult | null;
  securityFindings: SecurityFinding[];
  activeTab: PlaygroundTab;
  contractAddress: string;
  loadedAbi: unknown[];
};
