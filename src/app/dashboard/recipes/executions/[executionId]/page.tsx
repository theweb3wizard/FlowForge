'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  ExternalLink,
  ArrowLeft,
  FileCode,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useRecipeExecution, useDeploymentsByExecution } from '@/hooks/use-queries';
import { formatDistanceToNow } from 'date-fns';
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/web3/network';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RecipeExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.executionId as string;

  const { data: execution, isLoading: executionLoading, error: executionError } = useRecipeExecution(executionId);
  const { data: deployments = [], isLoading: deploymentsLoading } = useDeploymentsByExecution(executionId);

  useEffect(() => {
    if (executionError) {
      toast.error('Failed to load execution details');
    }
  }, [executionError]);

  if (executionLoading) {
    return <ExecutionPageSkeleton />;
  }

  if (!execution) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Execution Not Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            The recipe execution you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/dashboard/recipes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </Card>
      </div>
    );
  }

  const successCount = execution.step_results.filter((r) => r.status === 'success').length;
  const errorCount = execution.step_results.filter((r) => r.status === 'error').length;
  const isSuccess = execution.status === 'completed' && errorCount === 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/recipes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isSuccess ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : execution.status === 'failed' ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-500" />
              )}
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter">
                Recipe Execution
              </h1>
            </div>
            <p className="text-muted-foreground">
              Executed {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
            </p>
          </div>

          <Badge
            variant={isSuccess ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {execution.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{execution.total_steps}</div>
            <div className="text-sm text-muted-foreground">Total Steps</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{deployments.length}</div>
            <div className="text-sm text-muted-foreground">Contracts Deployed</div>
          </div>
        </div>
      </Card>

      {/* Deployed Contracts Section */}
      {deployments.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Deployed Contracts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            All contracts deployed during this recipe execution
          </p>

          <div className="space-y-3">
            {deployments.map((deployment, index) => (
              <Card key={deployment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {deployment.template?.icon && (
                          <span className="text-lg">{deployment.template.icon}</span>
                        )}
                        <h3 className="font-semibold text-lg">{deployment.contract_name}</h3>
                      </div>

                      {deployment.template && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {deployment.template.name}
                        </p>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Address:</span>
                          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {deployment.contract_address}
                          </code>
                          <Link
                            href={getExplorerAddressUrl('blockdag-testnet', deployment.contract_address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>

                        {deployment.transaction_hash && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Transaction:</span>
                            <Link
                              href={getExplorerTxUrl('blockdag-testnet', deployment.transaction_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View on Explorer
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/contract/${deployment.contract_address}`}>
                    <Button size="sm">
                      <FileCode className="mr-2 h-4 w-4" />
                      Interact
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Execution Steps Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Execution Steps
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Detailed breakdown of each step in the recipe execution
        </p>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {execution.step_results.map((step, index) => {
              const sourceStep = step.sourceRecipeStep;
              
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    step.status === 'success'
                      ? 'border-green-500/50 bg-green-500/5'
                      : step.status === 'error'
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0 ${
                          step.status === 'success'
                            ? 'bg-green-500 text-white'
                            : step.status === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {sourceStep?.type === 'deploy' ? (
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Send className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h4 className="font-medium">
                            {sourceStep?.type === 'deploy'
                              ? `Deploy: ${sourceStep.contractName}`
                              : sourceStep?.type === 'interact'
                              ? `Call: ${sourceStep.functionName}`
                              : 'Unknown Step'}
                          </h4>
                        </div>

                        {step.status === 'success' && (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs text-green-600 font-medium">
                              ✅ Completed successfully
                            </p>
                            {step.contractAddress && (
                              <p className="text-xs font-mono">
                                📍 {step.contractAddress}
                              </p>
                            )}
                            {step.transactionHash && (
                              <Link
                                href={getExplorerTxUrl('blockdag-testnet', step.transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View transaction
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        )}

                        {step.status === 'error' && (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs text-red-600 font-medium">❌ Failed</p>
                            <p className="text-xs text-red-600 break-words">{step.error}</p>
                          </div>
                        )}

                        {step.startedAt && step.completedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Duration: {Math.round((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)}s
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 flex-shrink-0">
                      {step.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {step.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Error Message (if execution failed) */}
      {execution.error_message && (
        <Card className="p-6 mt-6 border-red-500/50 bg-red-500/5">
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Execution Error
          </h3>
          <p className="text-sm text-red-600">{execution.error_message}</p>
        </Card>
      )}
    </div>
  );
}

function ExecutionPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-12 w-96 mb-2" />
      <Skeleton className="h-5 w-64 mb-8" />
      
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}