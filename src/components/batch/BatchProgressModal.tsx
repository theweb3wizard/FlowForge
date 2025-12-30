'use client';

import { useEffect, useState } from 'react';
import { useBatch } from '@/contexts/BatchContext';
import { useBatchDeploy } from '@/hooks/useBatchDeploy';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { getExplorerTxUrl } from '@/lib/web3/network';
import { Confetti } from '../common/Confetti';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchProgressModal({ isOpen, onClose }: BatchProgressModalProps) {
  const router = useRouter();
  const { batchItems, updateBatchItem, clearBatch } = useBatch();
  const { deployBatch, isBatchDeploying, currentDeployingIndex } = useBatchDeploy();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen && batchItems.length > 0 && !isBatchDeploying && !isComplete) {
      // Start deployment
      const deploymentItems = batchItems.map((item) => ({
        id: item.id,
        template: item.template,
        contractName: item.contractName,
        constructorArgs: item.constructorArgs,
      }));

      // Set all to deploying
      batchItems.forEach((item) => {
        updateBatchItem(item.id, { status: 'pending' });
      });

      deployBatch(deploymentItems, (itemId, result) => {
        if (result.success) {
          updateBatchItem(itemId, {
            status: 'success',
            contractAddress: result.contractAddress,
            transactionHash: result.transactionHash,
          });
        } else {
          updateBatchItem(itemId, {
            status: 'error',
            error: result.error,
            transactionHash: result.transactionHash,
          });
        }
      }).then(() => {
        setIsComplete(true);
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isBatchDeploying) {
      onClose();
      // Reset after a delay to allow modal to close
      setTimeout(() => {
        setIsComplete(false);
      }, 300);
    }
  };

  const handleViewDashboard = () => {
    clearBatch();
    onClose();
    router.push('/dashboard');
  };

  const successCount = batchItems.filter((item) => item.status === 'success').length;
  const errorCount = batchItems.filter((item) => item.status === 'error').length;
  const totalCount = batchItems.length;
  const overallProgress = Math.round(((successCount + errorCount) / totalCount) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        {isComplete && successCount === totalCount && <Confetti />}
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              successCount === totalCount ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Batch Deployment Complete!
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Batch Deployment Finished with Errors
                </>
              )
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Deploying Contracts...
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `${successCount} of ${totalCount} contracts deployed successfully`
              : `Deploying ${totalCount} contracts sequentially. Please confirm each transaction in your wallet.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {successCount + errorCount} / {totalCount}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Summary Stats */}
          {isComplete && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}

          {/* Individual Contract Status */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {batchItems.map((item, index) => {
                const isCurrentlyDeploying = currentDeployingIndex === index && isBatchDeploying;
                const templateParams = Array.isArray(item.template.parameters)
                  ? item.template.parameters
                  : [];

                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${
                      item.status === 'success'
                        ? 'border-green-500/50 bg-green-500/5'
                        : item.status === 'error'
                        ? 'border-red-500/50 bg-red-500/5'
                        : isCurrentlyDeploying
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                            item.status === 'success'
                              ? 'bg-green-500 text-white'
                              : item.status === 'error'
                              ? 'bg-red-500 text-white'
                              : isCurrentlyDeploying
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{item.template.icon}</span>
                            <h4 className="font-medium truncate">{item.contractName}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.template.name}
                          </p>

                          {/* Constructor Args Summary */}
                          {templateParams.length > 0 && (
                            <div className="text-xs space-y-1 mb-2">
                              {templateParams.map((param, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <span className="text-muted-foreground">{param.name}:</span>
                                  <span className="font-mono truncate">
                                    {item.constructorArgs[idx]?.toString() || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Status Message */}
                          {item.status === 'success' && item.contractAddress && (
                            <div className="space-y-1">
                              <p className="text-xs text-green-600 font-medium">
                                ✅ Deployed successfully
                              </p>
                              <p className="text-xs font-mono truncate">
                                {item.contractAddress}
                              </p>
                              {item.transactionHash && (
                                <Link
                                  href={getExplorerTxUrl('blockdag-testnet', item.transactionHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View on explorer
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          )}

                          {item.status === 'error' && (
                            <div className="space-y-1">
                              <p className="text-xs text-red-600 font-medium">
                                ❌ Deployment failed
                              </p>
                              <p className="text-xs text-red-600">{item.error}</p>
                              {item.transactionHash && (
                                <Link
                                  href={getExplorerTxUrl('blockdag-testnet', item.transactionHash)}
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

                          {isCurrentlyDeploying && (
                            <p className="text-xs text-primary font-medium flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Deploying... Please confirm in wallet
                            </p>
                          )}

                          {item.status === 'pending' && !isCurrentlyDeploying && (
                            <p className="text-xs text-muted-foreground">⏳ Waiting...</p>
                          )}
                        </div>
                      </div>

                      <div className="ml-2">
                        {item.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {item.status === 'error' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {isCurrentlyDeploying && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Actions */}
          {isComplete && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleViewDashboard} className="flex-1">
                View Dashboard
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          )}

          {!isComplete && (
            <p className="text-xs text-center text-muted-foreground">
              Deployment in progress... Please don't close this window.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}