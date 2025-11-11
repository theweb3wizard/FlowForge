import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// This file is safe for SSR because it only defines configuration objects
// and does not execute code that depends on browser APIs.

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // Adding ssr: true helps wagmi to work better with server-side rendering
  ssr: true, 
});
