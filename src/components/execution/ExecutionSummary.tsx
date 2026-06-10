'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Copy, History, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ExecutionStatus, StepResult } from '@/types/execution';

type ExecutionSummaryProps = {
  executionStatus: ExecutionStatus;
  completedResults: StepResult[];
  recipeId: string;
  error: string | null;
  chainId?: number;
};

export function ExecutionSummary({
  executionStatus,
  completedResults,
  recipeId,
  error,
  chainId,
}: ExecutionSummaryProps) {
  const [copied, setCopied] = useState(false);

  const deployedAddresses = completedResults
    .filter((r) => r.status === 'success' && r.contractAddress)
    .map((r) => `${r.stepLabel}: ${r.contractAddress}`)
    .join('\n');

  const failedStep = completedResults.find((r) => r.status === 'failed');
  const failedStepOrder = failedStep?.stepOrder ?? null;

  const handleCopyAddresses = async () => {
    try {
      await navigator.clipboard.writeText(deployedAddresses);
      setCopied(true);
      toast.success('Addresses copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy addresses.');
    }
  };

  if (executionStatus === 'success') {
    return (
      <div className="rounded-md border border-green-500/30 bg-green-500/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-green-400">
              Deployment Complete
            </h3>
            <p className="text-sm text-muted-foreground">
              All steps executed successfully.
            </p>
          </div>
        </div>

        {deployedAddresses && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Deployed Contracts
            </p>
            <Textarea
              value={deployedAddresses}
              readOnly
              rows={Math.min(deployedAddresses.split('\n').length + 1, 8)}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCopyAddresses}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy All Addresses
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/recipe/${recipeId}/history`}>
              <History className="h-3 w-3" />
              View Execution History
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/recipe/${recipeId}/run${chainId ? `?chainId=${chainId}` : ''}`}>
              <RefreshCw className="h-3 w-3" />
              Run Again
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Partial or failed
  const stoppedAtStep =
    failedStepOrder !== null ? failedStepOrder + 1 : null;

  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/5 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <XCircle className="h-8 w-8 text-red-500" />
        <div>
          <h3 className="text-lg font-semibold text-red-400">
            {stoppedAtStep !== null
              ? `Deployment Stopped at Step ${stoppedAtStep}`
              : 'Deployment Failed'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {executionStatus === 'partial'
              ? 'Some steps completed before the failure.'
              : 'No steps completed.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link
            href={
              failedStepOrder !== null
                ? `/recipe/${recipeId}/run?resumeFrom=${failedStepOrder}${chainId ? `&chainId=${chainId}` : ''}`
                : `/recipe/${recipeId}/run${chainId ? `?chainId=${chainId}` : ''}`
            }
          >
            <RefreshCw className="h-3 w-3" />
            {stoppedAtStep !== null
              ? `Retry from Step ${stoppedAtStep}`
              : 'Retry'}
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href={`/recipe/${recipeId}/history`}>
            <History className="h-3 w-3" />
            View Execution History
          </Link>
        </Button>
      </div>
    </div>
  );
}
