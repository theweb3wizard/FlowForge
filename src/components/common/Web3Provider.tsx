"use client";

import React, { ReactNode, useState, useEffect, Suspense } from 'react';
import type { Web3ClientProvider } from '@/lib/wagmi-client';

export function Web3Provider({ children }: { children: ReactNode }) {
  const [ClientProvider, setClientProvider] = useState<typeof Web3ClientProvider | null>(null);

  useEffect(() => {
    // Dynamically import the client-side provider
    import('@/lib/wagmi-client')
      .then((module) => {
        setClientProvider(() => module.Web3ClientProvider);
      })
      .catch((err) => {
        console.error("Failed to load Web3ClientProvider", err);
      });
  }, []);

  // On the server and during initial client render, render nothing.
  if (!ClientProvider) {
    // You can return a loader here if you prefer
    return null;
  }

  // Once mounted on the client, render the full provider tree and the children.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientProvider>{children}</ClientProvider>
    </Suspense>
  );
}