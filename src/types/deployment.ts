import type { ContractTemplate } from './template';

/**
 * Deployment record from Supabase
 */
export interface Deployment {
  id: string;
  template_id: string;
  contract_name: string;
  contract_address: string;
  deployer_address: string;
  network: NetworkType;
  chain_id: number;
  transaction_hash: string;
  constructor_args: Record<string, any>;
  deployment_status: DeploymentStatus;
  error_message?: string;
  deployed_at: string;
}

/**
 * Network types supported by FlowForge
 */
export type NetworkType = 'blockdag-testnet' | 'blockdag-mainnet' | 'local';

/**
 * Deployment status states
 */
export type DeploymentStatus = 'pending' | 'success' | 'failed';

/**
 * Deployment creation payload (for inserting into Supabase)
 */
export interface CreateDeploymentPayload {
  template_id: string;
  contract_name: string;
  deployer_address: string;
  network: NetworkType;
  chain_id: number;
  constructor_args: Record<string, any>;
  deployment_status: DeploymentStatus;
  contract_address?: string;
  transaction_hash?: string;
  error_message?: string;
}

/**
 * Deployment with template details (for UI display)
 */
export interface DeploymentWithTemplate extends Deployment {
  template?: ContractTemplate;
}
