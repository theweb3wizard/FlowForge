
import { http, createConfig, type Chain } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const blockdagTestnet = {
  id: 1043,
  name: 'BlockDAG Testnet',
  nativeCurrency: { name: 'tBDAG', symbol: 'tBDAG', decimals: 18 },
  rpcUrls: {
    // Use the proxied URL for client-side requests to avoid CORS issues
    default: { http: [process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL || '/api/rpc'] },
    public: { http: [process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL || '/api/rpc'] },
  },
  blockExplorers: {
    default: { name: 'BlockDAG Explorer', url: process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL || '' },
  },
} as const satisfies Chain;

const localnet = {
  id: 31337,
  name: 'Localnet',
  nativeCurrency: { name: 'Local Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
} as const satisfies Chain;


export const config = createConfig({
  chains: [blockdagTestnet, localnet, mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [blockdagTestnet.id]: http(process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL || '/api/rpc'),
    [localnet.id]: http(),
  },
  ssr: false, 
});
