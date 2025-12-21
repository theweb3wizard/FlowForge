import { supabase } from '@/lib/supabase';
import { Deployment, CreateDeploymentPayload, DeploymentWithTemplate } from '@/types/deployment';

/**
 * Save a new deployment to the database
 */
export async function createDeployment(payload: CreateDeploymentPayload): Promise<Deployment | null> {
  
  const { data, error } = await supabase
    .from('deployments')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all deployments (public feed)
 */
export async function getAllDeployments(): Promise<DeploymentWithTemplate[]> {
  
  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:contract_templates(*)
    `)
    .eq('deployment_status', 'success')
    .order('deployed_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching deployments:', error);
    throw error;
  }

  return (data as any) || [];
}

/**
 * Fetch deployments by deployer address (user's contracts)
 */
export async function getDeploymentsByAddress(address: string): Promise<DeploymentWithTemplate[]> {
  
  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:contract_templates(*)
    `)
    .eq('deployer_address', address.toLowerCase())
    .order('deployed_at', { ascending: false });

  if (error) {
    console.error('Error fetching user deployments:', error);
    throw error;
  }

  return (data as any) || [];
}

/**
 * Fetch a single deployment by contract address
 */
export async function getDeploymentByContractAddress(contractAddress: string): Promise<DeploymentWithTemplate | null> {
  
  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:contract_templates(*)
    `)
    .eq('contract_address', contractAddress.toLowerCase())
    .single();

  if (error) {
    console.error('Error fetching deployment:', error);
    return null;
  }

  return data as any;
}

/**
 * Update deployment status (for handling failures)
 */
export async function updateDeploymentStatus(
  id: string,
  status: 'success' | 'failed',
  updateData: Partial<Deployment>
): Promise<void> {
  
  const { error } = await supabase
    .from('deployments')
    .update({
      deployment_status: status,
      ...updateData,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating deployment status:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time deployment updates
 */
export function subscribeToDeployments(callback: (payload: any) => void) {
  
  const channel = supabase
    .channel('deployments-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'deployments' },
      callback
    )
    .subscribe();

  return channel;
}
