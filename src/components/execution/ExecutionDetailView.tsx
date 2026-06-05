'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Execution } from '@/types/execution';
import type { SupportedChain } from '@/types/chain';
import { formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/lib/utils';

type ExecutionDetailViewProps = {
  execution: Execution | null;
  recipeName: string;
  chain: SupportedChain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function statusColor(status: string) {
  switch (status) {
    case 'success': return 'text-green-400';
    case 'failed': return 'text-red-400';
    case 'partial': return 'text-amber-400';
    default: return 'text-muted-foreground';
  }
}

export function ExecutionDetailView({
  execution,
  recipeName,
  chain,
  open,
  onOpenChange,
}: ExecutionDetailViewProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = () => {
    if (!execution) return;
    setIsExporting(true);

    try {
      const header = 'Step Number,Step Label,Status,Contract Address,Transaction Hash,Completed At\n';
      const rows = execution.stepResults.map((r) =>
        [
          r.stepOrder + 1,
          `"${r.stepLabel.replace(/"/g, '""')}"`,
          r.status,
          r.contractAddress ?? '',
          r.txHash ?? '',
          r.completedAt ?? '',
        ].join(','),
      );

      const csvContent = header + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const execDate = new Date(execution.startedAt)
        .toISOString()
        .slice(0, 10);
      const safeName = recipeName.replace(/[^a-z0-9]/gi, '_');
      const safeChain = execution.chainName.replace(/[^a-z0-9]/gi, '_');
      const filename = `${safeName}_${safeChain}_${execDate}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <SheetTitle>Execution Details</SheetTitle>
          <SheetDescription>
            {execution
              ? `${execution.chainName} · ${formatRelativeTime(execution.startedAt)}`
              : ''}
          </SheetDescription>
        </SheetHeader>

        {execution && (
          <div className="mt-6 space-y-4">
            {/* Step results */}
            {execution.stepResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No step results recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {execution.stepResults.map((result) => (
                  <div
                    key={result.stepOrder}
                    className={cn(
                      'rounded-md border px-4 py-3 space-y-1.5',
                      result.status === 'success' && 'border-green-500/30 bg-green-500/5',
                      result.status === 'failed' && 'border-red-500/30 bg-red-500/5',
                      result.status === 'pending' && 'border-border bg-card',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {result.stepOrder + 1}
                      </span>
                      <span className="text-sm font-medium">{result.stepLabel}</span>
                      <span className={cn('ml-auto text-xs font-medium', statusColor(result.status))}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    {result.contractAddress && (
                      <p className="font-mono text-xs text-muted-foreground break-all">
                        Contract: {result.contractAddress}
                      </p>
                    )}
                    {result.txHash && (
                      <p className="font-mono text-xs text-muted-foreground break-all">
                        Tx: {result.txHash}
                      </p>
                    )}
                    {result.errorMessage && (
                      <p className="text-xs text-red-400">{result.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Export CSV */}
            {execution.stepResults.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportCsv}
                disabled={isExporting}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
