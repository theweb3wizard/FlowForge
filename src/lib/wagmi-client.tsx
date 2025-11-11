
"use client";

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { WalletProvider } from '@/contexts/WalletContext';

// Set up a QueryClient for react-query
const queryClient = new QueryClient();

// This is the actual client-side provider component.
// It wraps the children with all the necessary web3 context providers.
export function Web3ClientProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
