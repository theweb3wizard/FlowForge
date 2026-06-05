'use client';

import { Check, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getExplorerAddressUrl, getExplorerTxUrl } from '@/config/chains';
import type { SupportedChain } from '@/types/chain';
import type { StepResult, StepStatus } from '@/types/execution';
import type { RecipeStep } from '@/types/recipe';
import { truncateAddress } from '@/utils/formatAddress';
import { cn } from '@/lib/utils';

type StepProgressCardProps = {
  step: RecipeStep;
  result: StepResult | null;
  status: StepStatus;
  chain: SupportedChain;
};

function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  return (
    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
      <span>{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </span>
  );
}

function ExplorerLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function StepProgressCard({
  step,
  result,
  status,
  chain,
}: StepProgressCardProps) {
  const borderClass = cn({
    'border-border': status === 'pending',
    'border-amber-500/50': status === 'running',
    'border-green-500/50': status === 'success',
    'border-red-500/50': status === 'failed',
  });

  const bgClass = cn({
    'bg-card': status === 'pending',
    'bg-amber-500/5': status === 'running',
    'bg-green-500/5': status === 'success',
    'bg-red-500/5': status === 'failed',
  });

  return (
    <div className={cn('rounded-md border px-4 py-3 transition-all', borderClass, bgClass)}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          {status === 'pending' && (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
          {status === 'running' && (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          )}
          {status === 'success' && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {status === 'failed' && (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {/* Step header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {step.stepOrder + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                status === 'pending' && 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0',
                step.stepType === 'deploy'
                  ? 'border-blue-500/40 text-blue-400'
                  : 'border-amber-500/40 text-amber-400',
              )}
            >
              {step.stepType === 'deploy' ? 'DEPLOY' : 'INTERACT'}
            </Badge>
          </div>

          {/* Running sub-text */}
          {status === 'running' && (
            <p className="text-xs text-amber-400/80">
              Waiting for wallet confirmation…
            </p>
          )}

          {/* Success details */}
          {status === 'success' && result && (
            <div className="space-y-1.5">
              {result.contractAddress && (
                <div className="flex flex-wrap items-center gap-3">
                  <CopyableValue
                    value={result.contractAddress}
                    label={truncateAddress(result.contractAddress)}
                  />
                  <ExplorerLink
                    url={getExplorerAddressUrl(chain, result.contractAddress)}
                    label="View contract"
                  />
                </div>
              )}
              {result.txHash && (
                <div className="flex flex-wrap items-center gap-3">
                  <CopyableValue
                    value={result.txHash}
                    label={truncateAddress(result.txHash)}
                  />
                  <ExplorerLink
                    url={getExplorerTxUrl(chain, result.txHash)}
                    label="View tx"
                  />
                </div>
              )}
            </div>
          )}

          {/* Failed details */}
          {status === 'failed' && result?.errorMessage && (
            <p className="text-xs text-red-400/90">{result.errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
