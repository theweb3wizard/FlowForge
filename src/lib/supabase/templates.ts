import { supabase } from '@/lib/supabase';
import { ContractTemplate } from '@/types/template';

/**
 * Fetch all active contract templates
 */
export async function getActiveTemplates(): Promise<ContractTemplate[]> {
  
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single template by ID
 */
export async function getTemplateById(id: string): Promise<ContractTemplate | null> {
  
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    return null;
  }

  return data;
}

/**
 * Fetch templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<ContractTemplate[]> {
  
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('status', 'active')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates by category:', error);
    throw error;
  }

  return data || [];
}