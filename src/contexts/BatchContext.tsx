'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContractTemplate } from '@/types/template';

interface BatchItem {
  id: string; // Unique ID for this batch item
  template: ContractTemplate;
  contractName: string;
  constructorArgs: any[];
  status: 'pending' | 'deploying' | 'success' | 'error';
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

interface BatchContextType {
  batchItems: BatchItem[];
  addToBatch: (template: ContractTemplate) => void;
  removeFromBatch: (itemId: string) => void;
  updateBatchItem: (itemId: string, updates: Partial<BatchItem>) => void;
  clearBatch: () => void;
  batchCount: number;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const addToBatch = useCallback((template: ContractTemplate) => {
    const newItem: BatchItem = {
      id: `${template.id}-${Date.now()}`, // Unique ID
      template,
      contractName: template.name,
      constructorArgs: [],
      status: 'pending',
    };

    setBatchItems((prev) => [...prev, newItem]);
  }, []);

  const removeFromBatch = useCallback((itemId: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateBatchItem = useCallback((itemId: string, updates: Partial<BatchItem>) => {
    setBatchItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const clearBatch = useCallback(() => {
    setBatchItems([]);
  }, []);

  const batchCount = batchItems.length;

  return (
    <BatchContext.Provider
      value={{
        batchItems,
        addToBatch,
        removeFromBatch,
        updateBatchItem,
        clearBatch,
        batchCount,
      }}
    >
      {children}
    </BatchContext.Provider>
  );
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}