
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { type Deployment } from '@/lib/deployments';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Abi } from 'viem';

// Ensure that when adding a deployment, the ABI is always required.
interface AddDeploymentArgs extends Omit<Deployment, 'timestamp' | 'id' | 'abi'> {
    abi: Abi;
}
interface DeploymentContextType {
  newDeployment: Deployment | null;
  addDeployment: (deployment: AddDeploymentArgs) => Promise<void>;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

export const DeploymentProvider = ({ children }: { children: ReactNode }) => {
  // This state will only hold the *most recently created* deployment.
  const [newDeployment, setNewDeployment] = useState<Deployment | null>(null);
  const { toast } = useToast();

  const addDeployment = useCallback(async (deployment: AddDeploymentArgs) => {
    // This object includes all required fields for a valid database insert.
    const newDeploymentData = {
      contractName: deployment.contractName,
      address: deployment.address,
      deployer: deployment.deployer,
      transactionHash: deployment.transactionHash,
      abi: deployment.abi, // Persist the ABI
    };

    const { data, error } = await supabase
      .from('deployments')
      .insert([newDeploymentData])
      .select();

    if (error) {
      console.error('Error adding deployment:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving deployment',
        description: 'Your deployment could not be saved to the database.',
      });
    } else if (data) {
      const createdDeployment = data[0] as Deployment;
      setNewDeployment(createdDeployment);
    }
  }, [toast]);

  return (
    <DeploymentContext.Provider value={{ newDeployment, addDeployment }}>
      {children}
    </DeploymentContext.Provider>
  );
};

export const useDeployments = () => {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error('useDeployments must be used within a DeploymentProvider');
  }
  return context;
};

// Re-export the type for convenience
export type { Deployment };
