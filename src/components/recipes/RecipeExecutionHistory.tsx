'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RecipeExecution } from '@/types/recipe';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  History,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function RecipeExecutionHistory() {
  const { address } = useWallet();

  // Fetch all executions for the current user
  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['recipe-executions', 'user', address],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_executions')
        .select(`
          *,
          recipes (
            id,
            name,
            description
          )
        `)
        .eq('executor_address', address!.toLowerCase())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as (RecipeExecution & { recipes: { id: string; name: string; description: string } })[];
    },
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Execution History</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Run a recipe to see its execution history here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Execution History</h2>
          <p className="text-sm text-muted-foreground">
            All recipe executions across your account
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {executions.length} execution{executions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {executions.map((execution) => {
            const isSuccess = execution.status === 'completed';
            const isFailed = execution.status === 'failed';
            const isRunning = execution.status === 'running';

            const successCount = execution.step_results?.filter(
              (r: any) => r.status === 'success'
            ).length || 0;

            return (
              <Card
                key={execution.id}
                className={`p-6 hover:shadow-lg transition-shadow ${
                  isSuccess
                    ? 'border-green-500/30'
                    : isFailed
                    ? 'border-red-500/30'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isSuccess ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : isFailed ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {execution.recipes?.name || 'Unknown Recipe'}
                        </h3>
                        {execution.recipes?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {execution.recipes.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/recipes/executions/${execution.id}`}>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(execution.started_at), {
                      addSuffix: true,
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {successCount} / {execution.total_steps} steps completed
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      isSuccess
                        ? 'default'
                        : isFailed
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {execution.status.toUpperCase()}
                  </Badge>

                  {execution.completed_at && (
                    <Badge variant="outline" className="text-xs">
                      Duration:{' '}
                      {Math.round(
                        (new Date(execution.completed_at).getTime() -
                          new Date(execution.started_at).getTime()) /
                          1000
                      )}
                      s
                    </Badge>
                  )}
                </div>

                {execution.error_message && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600">
                    <span className="font-medium">Error: </span>
                    {execution.error_message}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}