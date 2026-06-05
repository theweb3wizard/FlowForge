'use client';

import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SUPPORTED_CHAINS, TESTNET_CHAIN_IDS } from '@/config/chains';
import type { SupportedChain } from '@/types/chain';
import { cn } from '@/lib/utils';

type ChainSelectorProps = {
  selectedChain: SupportedChain | null;
  onChainSelect: (chain: SupportedChain) => void;
};

export function ChainSelector({ selectedChain, onChainSelect }: ChainSelectorProps) {
  const isMainnetSelected =
    selectedChain !== null && !TESTNET_CHAIN_IDS.includes(selectedChain.id);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORTED_CHAINS.map((chain) => {
          const isSelected = selectedChain?.id === chain.id;
          return (
            <button
              key={chain.id}
              onClick={() => onChainSelect(chain)}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-accent text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">
                  {chain.name}
                </span>
                <span className="font-mono text-xs">{chain.shortName}</span>
              </div>
              {chain.isTestnet && (
                <Badge variant="outline" className="shrink-0 text-xs border-amber-500/40 text-amber-400">
                  TESTNET
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {isMainnetSelected && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-amber-300">
              Mainnet Deployment
            </p>
            <p className="text-xs text-amber-400/80">
              This will execute real transactions. Gas fees will be charged to
              your connected wallet. Double-check all parameters before
              proceeding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
