"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
} from 'wagmi';
import { type Connector } from 'wagmi';

interface WalletContextType {
  address: `0x${string}` | undefined;
  connectors: readonly Connector[];
  connect: (args?: { connector: Connector }) => void;
  disconnect: () => void;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const handleConnect: WalletContextType['connect'] = (args) => {
    connect(args, {
      onSuccess: (data) => {
        toast({
          title: "Wallet Connected",
          description: `Address: ${data.accounts[0].slice(0, 6)}...${data.accounts[0].slice(-4)}`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message,
        });
      }
    });
  };

  const handleDisconnect: WalletContextType['disconnect'] = () => {
    disconnect(undefined, {
      onSuccess: () => {
        toast({
          title: "Wallet Disconnected",
        });
      }
    });
  };


  return (
    <WalletContext.Provider value={{ address, connectors, connect: handleConnect, disconnect: handleDisconnect, error }}>
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
