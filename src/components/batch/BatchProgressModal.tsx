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
      const deploymentItems = batchItems.map((item) => ({
        id: item.id,
        template: item.template,
        contractName: item.contractName,
        constructorArgs: item.constructorArgs,
      }));

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
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] sm:h-[85vh] max-h-[900px] flex flex-col p-0 gap-0">
        {isComplete && successCount === totalCount && <Confetti />}
        
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0 space-y-2 sm:space-y-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {isComplete ? (
              successCount === totalCount ? (
                <>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                  <span className="truncate">Batch Deployment Complete!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">Deployment Finished with Errors</span>
                </>
              )
            ) : (
              <>
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin flex-shrink-0" />
                <span className="truncate">Deploying Contracts...</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isComplete
              ? `${successCount} of ${totalCount} contracts deployed successfully`
              : `Deploying ${totalCount} contracts sequentially. Please confirm each transaction in your wallet.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 min-h-0">
          {/* Overall Progress */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {successCount + errorCount} / {totalCount}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Summary Stats */}
          {isComplete && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg flex-shrink-0">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{totalCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}

          {/* Individual Contract Status - SCROLLABLE AREA */}
          <div className="flex-1 min-h-0 -mx-4 sm:-mx-6">
            <ScrollArea className="h-full px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3 pb-2">
                {batchItems.map((item, index) => {
                  const isCurrentlyDeploying = currentDeployingIndex === index && isBatchDeploying;
                  const templateParams = Array.isArray(item.template.parameters)
                    ? item.template.parameters
                    : [];

                  return (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-4 border rounded-lg transition-colors ${
                        item.status === 'success'
                          ? 'border-green-500/50 bg-green-500/5'
                          : item.status === 'error'
                          ? 'border-red-500/50 bg-red-500/5'
                          : isCurrentlyDeploying
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div
                          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-semibold text-xs sm:text-sm flex-shrink-0 ${
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
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                            <span className="text-base sm:text-lg flex-shrink-0">{item.template.icon}</span>
                            <h4 className="font-medium text-sm sm:text-base truncate">{item.contractName}</h4>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                            {item.template.name}
                          </p>

                          {/* Constructor Args Summary */}
                          {templateParams.length > 0 && (
                            <div className="text-[10px] sm:text-xs space-y-0.5 sm:space-y-1 mb-2">
                              {templateParams.slice(0, 2).map((param, idx) => (
                                <div key={idx} className="flex gap-1 sm:gap-2">
                                  <span className="text-muted-foreground flex-shrink-0">{param.name}:</span>
                                  <span className="font-mono truncate">
                                    {item.constructorArgs[idx]?.toString() || 'N/A'}
                                  </span>
                                </div>
                              ))}
                              {templateParams.length > 2 && (
                                <div className="text-muted-foreground">
                                  +{templateParams.length - 2} more params
                                </div>
                              )}
                            </div>
                          )}

                          {/* Status Message */}
                          {item.status === 'success' && item.contractAddress && (
                            <div className="space-y-1">
                              <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                                ✅ Deployed successfully
                              </p>
                              <p className="text-[10px] sm:text-xs font-mono break-all">
                                {item.contractAddress}
                              </p>
                              {item.transactionHash && (
                                <Link
                                  href={getExplorerTxUrl('blockdag-testnet', item.transactionHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] sm:text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View on explorer
                                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Link>
                              )}
                            </div>
                          )}

                          {item.status === 'error' && (
                            <div className="space-y-1">
                              <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                                ❌ Deployment failed
                              </p>
                              <p className="text-[10px] sm:text-xs text-red-600 break-words">{item.error}</p>
                              {item.transactionHash && (
                                <Link
                                  href={getExplorerTxUrl('blockdag-testnet', item.transactionHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] sm:text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View transaction
                                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Link>
                              )}
                            </div>
                          )}

                          {isCurrentlyDeploying && (
                            <p className="text-[10px] sm:text-xs text-primary font-medium flex items-center gap-1.5 sm:gap-2">
                              <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin flex-shrink-0" />
                              <span className="truncate">Deploying... Please confirm in wallet</span>
                            </p>
                          )}

                          {item.status === 'pending' && !isCurrentlyDeploying && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">⏳ Waiting...</p>
                          )}
                        </div>

                        <div className="ml-1 sm:ml-2 flex-shrink-0">
                          {item.status === 'success' && (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          )}
                          {item.status === 'error' && (
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                          )}
                          {isCurrentlyDeploying && (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            {isComplete && (
              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t">
                <Button onClick={handleViewDashboard} className="flex-1 text-sm sm:text-base">
                  View Dashboard
                </Button>
                <Button onClick={handleClose} variant="outline" className="sm:w-auto text-sm sm:text-base">
                  Close
                </Button>
              </div>
            )}

            {!isComplete && (
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-2 pt-2">
                Deployment in progress... Please don't close this window.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
