"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Deployment } from '@/lib/deployments';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface DeploymentContextType {
  deployments: Deployment[];
  addDeployment: (deployment: Omit<Deployment, 'timestamp' | 'id'>) => Promise<void>;
  loading: boolean;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

export const DeploymentProvider = ({ children }: { children: ReactNode }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching deployments:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching data',
          description: 'Could not load deployments from the database.',
        });
      } else {
        setDeployments(data as Deployment[]);
      }
      setLoading(false);
    };

    fetchDeployments();
  }, [toast]);

  const addDeployment = async (deployment: Omit<Deployment, 'timestamp' | 'id'>) => {
    const newDeploymentData = {
      ...deployment,
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
      setDeployments(prev => [data[0] as Deployment, ...prev]);
    }
  };

  return (
    <DeploymentContext.Provider value={{ deployments, addDeployment, loading }}>
      {children}
    </DeploymentContext.Provider>
  );
};

export const useDeployments = () => {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error('useDeployments must be used within a Deployment