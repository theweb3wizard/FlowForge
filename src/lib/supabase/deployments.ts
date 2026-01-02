
import { supabase } from '@/lib/supabase';
import { Deployment, CreateDeploymentPayload, DeploymentWithTemplate } from '@/types/deployment';

const PAGE_SIZE = 5;

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
 * Fetch all deployments (public feed) with pagination
 */
export async function getAllDeployments(page: number): Promise<DeploymentWithTemplate[]> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:all_templates(*)
    `)
    .eq('deployment_status', 'success')
    .order('deployed_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching deployments:', error);
    throw error;
  }

  return (data as any) || [];
}

/**
 * Get total count of all deployments
 */
export async function getDeploymentsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('deployments')
      .select('*', { count: 'exact', head: true })
      .eq('deployment_status', 'success');

    if (error) {
        console.error('Error fetching deployments count:', error);
        throw error;
    }
    return count || 0;
}


/**
 * Fetch deployments by deployer address (user's contracts) with pagination
 */
export async function getDeploymentsByAddress(address: string, page: number): Promise<DeploymentWithTemplate[]> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:all_templates(*)
    `)
    .ilike('deployer_address', address) // Use ilike for case-insensitive matching
    .order('deployed_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching user deployments:', error);
    throw error;
  }

  return (data as any) || [];
}

/**
 * Get total count of deployments by a specific address
 */
export async function getMyDeploymentsCount(address: string): Promise<number> {
    const { count, error } = await supabase
        .from('deployments')
        .select('*', { count: 'exact', head: true })
        .ilike('deployer_address', address);
    
    if (error) {
        console.error('Error fetching my deployments count:', error);
        throw error;
    }
    return count || 0;
}


/**
 * Fetch a single deployment by contract address
 */
export async function getDeploymentByContractAddress(contractAddress: string): Promise<DeploymentWithTemplate | null> {
  
  const { data, error } = await supabase
    .from('deployments')
    .select(`
      *,
      template:all_templates(*)
    `)
    .ilike('contract_address', contractAddress) // Use ilike for case-insensitive matching
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
