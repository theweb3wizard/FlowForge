'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { ExecutionDetailView } from '@/components/execution/ExecutionDetailView';
import { getChainById } from '@/config/chains';
import type { Execution } from '@/types/execution';
import { formatRelativeTime } from '@/utils/formatDate';
import { cn } from '@/lib/utils';

type ExecutionHistoryRowProps = {
  execution: Execution;
  totalSteps: number;
  recipeName: string;
};

function StatusBadge({ status }: { status: Execution['status'] }) {
  const config = {
    success: { label: 'Success', className: 'border-green-500/40 text-green-400' },
    failed: { label: 'Failed', className: 'border-red-500/40 text-red-400' },
    partial: { label: 'Partial', className: 'border-amber-500/40 text-amber-400' },
    running: { label: 'Running', className: 'border-blue-500/40 text-blue-400' },
    pending: { label: 'Pending', className: 'border-border text-muted-foreground' },
  }[status];

  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}

export function ExecutionHistoryRow({
  execution,
  totalSteps,
  recipeName,
}: ExecutionHistoryRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const chain = getChainById(execution.chainId) ?? null;

  const completedCount = execution.stepResults.filter(
    (r) => r.status === 'success',
  ).length;

  return (
    <>
      <TableRow>
        <TableCell className="text-sm text-muted-foreground">
          {formatRelativeTime(execution.startedAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm">{execution.chainName}</span>
            {chain?.isTestnet && (
              <Badge
                variant="outline"
                className="text-xs border-amber-500/40 text-amber-400"
              >
                TESTNET
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={execution.status} />
        </TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">
          {completedCount}/{totalSteps}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailOpen(true)}
          >
            View Details
          </Button>
        </TableCell>
      </TableRow>

      <ExecutionDetailView
        execution={execution}
        recipeName={recipeName}
        chain={chain}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
