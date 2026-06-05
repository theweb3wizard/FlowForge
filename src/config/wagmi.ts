import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { VIEM_CHAINS } from '@/config/chains';

const chains = Object.values(VIEM_CHAINS);

const transports = chains.reduce<Record<number, ReturnType<typeof http>>>(
  (acc, chain) => {
    acc[chain.id] = http();
    return acc;
  },
  {},
);

export const wagmiConfig = createConfig({
  chains: chains as [typeof chains[0], ...typeof chains],
  connectors: [injected()],
  transports,
  ssr: true,
});
