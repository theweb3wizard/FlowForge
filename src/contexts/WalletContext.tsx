"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
} from 'wagmi';
import { type Connector } from 'wagmi';
import { type Provider } from 'ethers';
import { usePublicClient, useWalletClient } from 'wagmi';
import { type PublicClient, type WalletClient } from 'viem';
import { ethers } from 'ethers';


function publicClientToProvider(publicClient: PublicClient): ethers.providers.JsonRpcProvider {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === 'fallback')
    return new ethers.providers.FallbackProvider(
      (transport.transports as ReturnType<typeof transport>['transports']).map(
        ({ value }) => new ethers.providers.JsonRpcProvider(value?.url, network)
      )
    );
  return new ethers.providers.JsonRpcProvider(transport.url, network);
}

function walletClientToSigner(walletClient: WalletClient): ethers.Signer {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

interface WalletContextType {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | undefined;
  connectors: readonly Connector[];
  connect: (args?: { connector: Connector }) => void;
  disconnect: () => void;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const provider = useMemo(() => {
    if (!walletClient) return undefined;
    const { account, chain, transport } = walletClient;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    return new ethers.providers.Web3Provider(transport, network);
  }, [walletClient]);

  const handleConnect: WalletContextType['connect'] = (args) => {
    connect(args, {
      onSuccess: (data) => {
        toast.success("Wallet Connected", {
          description: `Address: ${data.accounts[0].slice(0, 6)}...${data.accounts[0].slice(-4)}`,
        });
      },
      onError: (error) => {
        toast.error("Connection Failed", {
          description: error.message,
        });
      }
    });
  };

  const handleDisconnect: WalletContextType['disconnect'] = () => {
    disconnect(undefined, {
      onSuccess: () => {
        toast.success("Wallet Disconnected");
      }
    });
  };


  return (
    <WalletContext.Provider value={{ address, isConnected, connectors, connect: handleConnect, disconnect: handleDisconnect, error, provider }}>
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
