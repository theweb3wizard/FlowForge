"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAddress = localStorage.getItem('flowforge_wallet_address');
      if (storedAddress) {
        setAddress(storedAddress);
      }
    } catch (error) {
      console.warn('Could not access localStorage. Wallet state will not persist.');
    }
  }, []);
  
  const connect = () => {
    // This is a simulation of a wallet connection
    const pseudoAddress = `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setAddress(pseudoAddress);
    try {
      localStorage.setItem('flowforge_wallet_address', pseudoAddress);
    } catch (error) {
       console.warn('Could not access localStorage. Wallet state will not persist.');
    }
    toast({
      title: "Wallet Connected",
      description: `Address: ${pseudoAddress.slice(0, 6)}...${pseudoAddress.slice(-4)}`,
    });
  };

  const disconnect = () => {
    setAddress(null);
    try {
      localStorage.removeItem('flowforge_wallet_address');
    } catch (error) {
       console.warn('Could not access localStorage.');
    }
    toast({
      title: "Wallet Disconnected",
    });
  };

  return (
    <WalletContext.Provider value={{ address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
