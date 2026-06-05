'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExecutionHistoryRow } from '@/components/execution/ExecutionHistoryRow';
import type { Execution } from '@/types/execution';

type ExecutionHistoryListProps = {
  executions: Execution[];
  totalSteps: number;
  recipeName: string;
};

export function ExecutionHistoryList({
  executions,
  totalSteps,
  recipeName,
}: ExecutionHistoryListProps) {
  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">No executions yet.</p>
            <p className="text-sm text-muted-foreground">
              Run your recipe to see history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Steps Completed</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => (
            <ExecutionHistoryRow
              key={execution.id}
              execution={execution}
              totalSteps={totalSteps}
              recipeName={recipeName}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
