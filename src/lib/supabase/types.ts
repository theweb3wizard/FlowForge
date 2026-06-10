export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          source_code: string | null;
          compiler_version: string | null;
          playground_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          source_code?: string | null;
          compiler_version?: string | null;
          playground_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          source_code?: string | null;
          compiler_version?: string | null;
          playground_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          step_order: number;
          step_type: 'deploy' | 'interact';
          label: string;
          contract_name: string | null;
          abi: Json;
          bytecode: string | null;
          target_address: string | null;
          function_name: string | null;
          constructor_params: Json;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          step_order: number;
          step_type: 'deploy' | 'interact';
          label: string;
          contract_name?: string | null;
          abi?: Json;
          bytecode?: string | null;
          target_address?: string | null;
          function_name?: string | null;
          constructor_params?: Json;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          step_order?: number;
          step_type?: 'deploy' | 'interact';
          label?: string;
          contract_name?: string | null;
          abi?: Json;
          bytecode?: string | null;
          target_address?: string | null;
          function_name?: string | null;
          constructor_params?: Json;
        };
        Relationships: [];
      };
      executions: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          chain_id: number;
          chain_name: string;
          status: 'pending' | 'running' | 'partial' | 'success' | 'failed';
          step_results: Json;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          user_id: string;
          chain_id: number;
          chain_name: string;
          status?: 'pending' | 'running' | 'partial' | 'success' | 'failed';
          step_results?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          user_id?: string;
          chain_id?: number;
          chain_name?: string;
          status?: 'pending' | 'running' | 'partial' | 'success' | 'failed';
          step_results?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      generation_log: {
        Row: {
          id: string;
          user_id: string | null;
          anon_token: string | null;
          prompt: string;
          generated_at: string;
          tokens_used: number | null;
          model_used: string;
          compilation_success: boolean | null;
          security_flags: Json;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anon_token?: string | null;
          prompt: string;
          generated_at?: string;
          tokens_used?: number | null;
          model_used?: string;
          compilation_success?: boolean | null;
          security_flags?: Json;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anon_token?: string | null;
          prompt?: string;
          generated_at?: string;
          tokens_used?: number | null;
          model_used?: string;
          compilation_success?: boolean | null;
          security_flags?: Json;
        };
        Relationships: [];
      };
      deployments: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string | null;
          network: string;
          contract_address: string;
          transaction_hash: string;
          deployer_address: string | null;
          status: 'pending' | 'confirmed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id?: string | null;
          network: string;
          contract_address: string;
          transaction_hash: string;
          deployer_address?: string | null;
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string | null;
          network?: string;
          contract_address?: string;
          transaction_hash?: string;
          deployer_address?: string | null;
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
