"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MOCK_DEPLOYMENTS, type Deployment } from '@/lib/deployments';

interface DeploymentContextType {
  deployments: Deployment[];
  addDeployment: (deployment: Omit<Deployment, 'timestamp' | 'id'>) => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

export const DeploymentProvider = ({ children }: { children: ReactNode }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    try {
      const storedDeployments = localStorage.getItem('flowforge_deployments');
      if (storedDeployments) {
        setDeployments(JSON.parse(storedDeployments));
      } else {
        setDeployments(MOCK_DEPLOYMENTS);
      }
    } catch (error) {
      console.warn('Could not access localStorage. Deployments will not persist.');
      setDeployments(MOCK_DEPLOYMENTS);
    }
  }, []);

  const updateLocalStorage = (newDeployments: Deployment[]) => {
    try {
      localStorage.setItem('flowforge_deployments', JSON.stringify(newDeployments));
    } catch (error) {
      console.warn('Could not access localStorage. Deployments will not persist.');
    }
  }

  const addDeployment = (deployment: Omit<Deployment, 'timestamp' | 'id'>) => {
    const newDeployment: Deployment = {
      ...deployment,
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setDeployments(prev => {
      const updatedDeployments = [newDeployment, ...prev];
      updateLocalStorage(updatedDeployments);
      return updatedDeployments;
    });
  };

  return (
    <DeploymentContext.Provider value={{ deployments, addDeployment }}>
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
