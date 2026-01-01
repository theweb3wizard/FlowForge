'use client';

import { useEffect, useState } from 'react';
import { Recipe, StepResult, RecipeStep, DeployStep } from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { useRecipeExecutor } from '@/hooks/useRecipeExecutor';
import { getTemplateById } from '@/lib/supabase/templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  AlertCircle,
  Layers,
  Send
} from 'lucide-react';
import { getExplorerTxUrl } from '@/lib/web3/network';
import { Confetti } from '../common/Confetti';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RecipeExecutorModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeExecutorModal({ recipe, isOpen, onClose }: RecipeExecutorModalProps) {
  const router = useRouter();
  const { executeRecipe, executionState } = useRecipeExecutor();
  const [templates, setTemplates] = useState<Map<string, ContractTemplate>>(new Map());
  const [stepResults, setStepResults] = useState<(StepResult & { sourceRecipeStep?: RecipeStep })[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (recipe && isOpen && !hasStarted) {
      loadTemplatesAndExecute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, isOpen]);

  const loadTemplatesAndExecute = async () => {
    if (!recipe) return;

    setHasStarted(true);
    
    const initialResults = recipe.steps.map((step, index) => ({
      stepIndex: index,
      status: 'pending',
      sourceRecipeStep: step
    }));
    setStepResults(initialResults as any);
    
    // Load all required templates
    const templateMap = new Map<string, ContractTemplate>();
    
    for (const step of recipe.steps) {
      if (step.type === 'deploy' && !templateMap.has(step.templateId)) {
        const template = await getTemplateById(step.templateId);
        if (template) {
          templateMap.set(step.templateId, template);
        }
      }
    }

    setTemplates(templateMap);

    // Start execution
    try {
      await executeRecipe(
        recipe,
        templateMap,
        (stepIndex, result) => {
          setStepResults((prev) => {
            const newResults = [...prev];
            newResults[stepIndex] = { ...newResults[stepIndex], ...result };
            return newResults;
          });
        }
      );
      
      setIsComplete(true);
      toast.success('Recipe executed successfully!');
    } catch (error: any) {
      console.error('Recipe execution failed:', error);
      toast.error('Recipe execution failed', {
        description: error.message || 'Unknown error',
      });
      setIsComplete(true);
    }
  };

  const handleClose = () => {
    if (!executionState.isExecuting) {
      setHasStarted(false);
      setIsComplete(false);
      setStepResults([]);
      onClose();
    }
  };

  const handleViewDashboard = () => {
    handleClose();
    router.push('/dashboard');
  };

  if (!recipe) return null;

  const successCount = stepResults.filter((r) => r.status === 'success').length;
  const errorCount = stepResults.filter((r) => r.status === 'error').length;
  const totalSteps = recipe.steps.length;
  const overallProgress = Math.round(((successCount + errorCount) / totalSteps) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        {isComplete && successCount === totalSteps && <Confetti />}
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              successCount === totalSteps ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Recipe Completed Successfully!
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Recipe Finished with Errors
                </>
              )
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Executing Recipe: {recipe.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `${successCount} of ${totalSteps} steps completed successfully`
              : `Executing ${totalSteps} steps sequentially. Please confirm each transaction in your wallet.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {successCount + errorCount} / {totalSteps}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Summary Stats */}
          {isComplete && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalSteps}</div>
                <div className="text-xs text-muted-foreground">Total Steps</div>
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

          {/* Step Details */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {recipe.steps.map((step, index) => {
                const result = stepResults[index];
                const isCurrentStep = executionState.currentStepIndex === index && executionState.isExecuting;
                const template = step.type === 'deploy' ? templates.get(step.templateId) : null;

                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      result?.status === 'success'
                        ? 'border-green-500/50 bg-green-500/5'
                        : result?.status === 'error'
                        ? 'border-red-500/50 bg-red-500/5'
                        : isCurrentStep
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0 ${
                            result?.status === 'success'
                              ? 'bg-green-500 text-white'
                              : result?.status === 'error'
                              ? 'bg-red-500 text-white'
                              : isCurrentStep
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {step.type === 'deploy' && template ? (
                                <span className="text-lg">{template.icon}</span>
                            ) : (
                                <Send className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className="font-medium">
                              {step.type === 'deploy'
                                ? `Deploy: ${step.contractName}`
                                : `Call: ${step.functionName}`}
                            </h4>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">
                             {step.type === 'deploy' && template
                              ? template.name
                              : `Interaction step`}
                          </p>

                          {/* Result */}
                          {result?.status === 'success' && (
                            <div className="space-y-1">
                              <p className="text-xs text-green-600 font-medium">
                                ✅ Step completed successfully
                              </p>
                              {result.contractAddress && (
                                <p className="text-xs font-mono truncate">
                                  📍 {result.contractAddress}
                                </p>
                              )}
                              {result.transactionHash && (
                                <Link
                                  href={getExplorerTxUrl('blockdag-testnet', result.transactionHash)}
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

                          {result?.status === 'error' && (
                            <div className="space-y-1">
                              <p className="text-xs text-red-600 font-medium">
                                ❌ Step failed
                              </p>
                              <p className="text-xs text-red-600 break-words">{result.error}</p>
                            </div>
                          )}

                          {isCurrentStep && (
                            <p className="text-xs text-primary font-medium flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Executing... Please confirm in wallet
                            </p>
                          )}

                          {result?.status === 'pending' && !isCurrentStep && (
                            <p className="text-xs text-muted-foreground">⏳ Waiting...</p>
                          )}
                        </div>
                      </div>

                      <div className="ml-2 flex-shrink-0">
                        {result?.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {result?.status === 'error' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {isCurrentStep && (
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
                <Layers className="mr-2 h-4 w-4" />
                View Dashboard
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          )}

          {!isComplete && (
            <p className="text-xs text-center text-muted-foreground">
              Recipe execution in progress... Please don't close this window.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
