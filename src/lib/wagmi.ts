import { http, createConfig, type Chain } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, polygonAmoy, arbitrumSepolia, optimism, optimismSepolia, base, baseSepolia, avalanche, avalancheFuji, bsc, bscTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

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
    mainnet,
    sepolia,
    polygon,
    arbitrum,
    optimism,
    base,
    polygonAmoy,
    arbitrumSepolia,
    optimismSepolia,
    baseSepolia,
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
    localnet,
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
    [localnet.id]: http(),
  },
  ssr: false, 
});