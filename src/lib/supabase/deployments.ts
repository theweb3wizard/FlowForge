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

  // Step 1: Get deployments
  const { data: deployments, error: deploymentsError } = await supabase
    .from('deployments')
    .select('*')
    .eq('deployment_status', 'success')
    .order('deployed_at', { ascending: false })
    .range(from, to);

  if (deploymentsError) {
    console.error('Error fetching deployments:', deploymentsError);
    throw deploymentsError;
  }

  if (!deployments || deployments.length === 0) {
    return [];
  }

  // Step 2: Get all unique template IDs
  const templateIds = [...new Set(deployments.map(d => d.template_id).filter(Boolean))];

  if (templateIds.length === 0) {
    // Return deployments without templates if no template IDs
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 3: Fetch templates from the view
  const { data: templates, error: templatesError } = await supabase
    .from('all_templates')
    .select('*')
    .in('id', templateIds);

  if (templatesError) {
    console.error('Error fetching templates:', templatesError);
    // Return deployments without templates if template fetch fails
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 4: Merge the data
  const templateMap = new Map((templates || []).map(t => [t.id, t]));
  
  return deployments.map(deployment => ({
    ...deployment,
    template: templateMap.get(deployment.template_id) || null
  }));
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

  // Step 1: Get deployments
  const { data: deployments, error: deploymentsError } = await supabase
    .from('deployments')
    .select('*')
    .ilike('deployer_address', address)
    .order('deployed_at', { ascending: false })
    .range(from, to);

  if (deploymentsError) {
    console.error('Error fetching user deployments:', deploymentsError);
    throw deploymentsError;
  }

  if (!deployments || deployments.length === 0) {
    return [];
  }

  // Step 2: Get all unique template IDs
  const templateIds = [...new Set(deployments.map(d => d.template_id).filter(Boolean))];

  if (templateIds.length === 0) {
    // Return deployments without templates if no template IDs
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 3: Fetch templates from the view
  const { data: templates, error: templatesError } = await supabase
    .from('all_templates')
    .select('*')
    .in('id', templateIds);

  if (templatesError) {
    console.error('Error fetching templates:', templatesError);
    // Return deployments without templates if template fetch fails
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 4: Merge the data
  const templateMap = new Map((templates || []).map(t => [t.id, t]));
  
  return deployments.map(deployment => ({
    ...deployment,
    template: templateMap.get(deployment.template_id) || null
  }));
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
  
  // Step 1: Get the deployment
  const { data: deployment, error: deploymentError } = await supabase
    .from('deployments')
    .select('*')
    .ilike('contract_address', contractAddress)
    .single();

  if (deploymentError) {
    console.error('Error fetching deployment:', deploymentError);
    return null;
  }

  if (!deployment) {
    return null;
  }

  // Step 2: Get the template if template_id exists
  if (deployment.template_id) {
    const { data: template, error: templateError } = await supabase
      .from('all_templates')
      .select('*')
      .eq('id', deployment.template_id)
      .single();

    if (templateError) {
      console.error('Error fetching template:', templateError);
      // Return deployment without template if fetch fails
      return { ...deployment, template: null };
    }

    return { ...deployment, template };
  }

  return { ...deployment, template: null };
}

/**
 * NEW: Fetch all deployments created by a specific recipe execution
 */
export async function getDeploymentsByExecutionId(executionId: string): Promise<DeploymentWithTemplate[]> {
  // Step 1: Get deployments linked to this execution
  const { data: deployments, error: deploymentsError } = await supabase
    .from('deployments')
    .select('*')
    .eq('recipe_execution_id', executionId)
    .order('deployed_at', { ascending: true });

  if (deploymentsError) {
    console.error('Error fetching deployments by execution ID:', deploymentsError);
    throw deploymentsError;
  }

  if (!deployments || deployments.length === 0) {
    return [];
  }

  // Step 2: Get all unique template IDs
  const templateIds = [...new Set(deployments.map(d => d.template_id).filter(Boolean))];

  if (templateIds.length === 0) {
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 3: Fetch templates
  const { data: templates, error: templatesError } = await supabase
    .from('all_templates')
    .select('*')
    .in('id', templateIds);

  if (templatesError) {
    console.error('Error fetching templates:', templatesError);
    return deployments.map(d => ({ ...d, template: null }));
  }

  // Step 4: Merge the data
  const templateMap = new Map((templates || []).map(t => [t.id, t]));
  
  return deployments.map(deployment => ({
    ...deployment,
    template: templateMap.get(deployment.template_id) || null
  }));
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