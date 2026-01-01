import { http, createConfig, type Chain } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, polygonAmoy, arbitrumSepolia, optimism, optimismSepolia, base, baseSepolia, avalanche, avalancheFuji, bsc, bscTestnet } from 'wagmi/chains';
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
  testnet: true,
} as const satisfies Chain;

const localnet = {
  id: 31337,
  name: 'Localnet',
  nativeCurrency: { name: 'Local Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
} as const satisfies Chain;


export const config = createConfig({
  chains: [
    blockdagTestnet,
    localnet,
    mainnet,
    sepolia,
    polygon,
    polygonAmoy,
    arbitrum,
    arbitrumSepolia,
    optimism,
    optimismSepolia,
    base,
    baseSepolia,
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
  ],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [blockdagTestnet.id]: http(process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL || '/api/rpc'),
    [localnet.id]: http(),
  },
  ssr: false, 
});