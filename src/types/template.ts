/**
 * Contract template structure from Supabase
 */
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  abi: any[]; // Ethereum ABI format
  bytecode: string;
  parameters: ConstructorParameter[];
  status: 'active' | 'deprecated';
  created_at: string;
  creator_address?: string; // Added to identify user-owned templates
}

/**
 * Constructor parameter definition
 */
export interface ConstructorParameter {
  name: string;
  type: string; // Solidity type (uint256, address, string, etc.)
  description?: string;
  required?: boolean;
}

/**
 * Template category for filtering
 */
export type TemplateCategory = 'DeFi' | 'NFT' | 'DAO' | 'Utility' | 'Other';


/**
 * Payload for creating a new user-defined template
 */
export interface CreateTemplatePayload {
    creator_address: string;
    name: string;
    description: string;
    icon: string;
    abi: any[];
    bytecode: string;
    parameters: ConstructorParameter[];
}
