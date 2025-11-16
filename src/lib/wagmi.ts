
import { http, createConfig, type Chain } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const blockdagTestnet = {
  id: Number(process.env.NEXT_PUBLIC_BLOCKDAG_CHAIN_ID || 11155111), // Default to Sepolia for safety
  name: 'BlockDAG Testnet',
  nativeCurrency: { name: 'tBDAG', symbol: 'tBDAG', decimals: 18 },
  rpcUrls: {
    // Use the proxied URL for client-side requests to avoid CORS issues
    default: { http: ['/api/rpc'] },
    public: { http: ['/api/rpc'] },
  },
  blockExplorers: {
    default: { name: 'BlockDAG Explorer', url: process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL || '' },
  },
} as const satisfies Chain;


export const config = createConfig({
  chains: [blockdagTestnet, mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // The transport now points to our local proxy
    [blockdagTestnet.id]: http('/api/rpc'),
  },
  ssr: false, 
});
