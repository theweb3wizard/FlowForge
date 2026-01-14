'use client';

import { useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeStep, DeployStep, InteractStep, VariableReference } from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Layers, Save, Send, Link as LinkIcon, Edit, Loader2, AlertCircle } from 'lucide-react';
import { createRecipe, updateRecipe } from '@/lib/supabase/recipes';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { separateFunctions } from '@/lib/abi/parser';

interface SimpleRecipeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ContractTemplate[];
  onRecipeCreated: (recipe: Recipe) => void;
  initialRecipe?: Recipe | null;
}

// NEW: Validation error type
interface ValidationError {
  stepIndex: number;
  field: string;
  message: string;
}

export function SimpleRecipeBuilder({
  isOpen,
  onClose,
  templates,
  onRecipeCreated,
  initialRecipe = null,
}: SimpleRecipeBuilderProps) {
  const { address } = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'deploy' | 'interact'>('deploy');

  const isEditMode = initialRecipe !== null;

  useEffect(() => {
    if (initialRecipe && isOpen) {
      setName(initialRecipe.name);
      setDescription(initialRecipe.description || '');
      setSteps(initialRecipe.steps);
    }
  }, [initialRecipe, isOpen]);

  // NEW: Comprehensive validation function
  const validateRecipe = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];

    steps.forEach((step, stepIndex) => {
      if (step.type === 'deploy') {
        // Validate contract name
        if (!step.contractName || step.contractName.trim().length === 0) {
          errors.push({
            stepIndex,
            field: 'contractName',
            message: 'Contract name is required',
          });
        }

        // Validate constructor arguments
        step.constructorArgs.forEach((arg, argIndex) => {
          if (typeof arg.value === 'string') {
            if (arg.value.trim().length === 0) {
              errors.push({
                stepIndex,
                field: `arg-${argIndex}`,
                message: `Parameter "${arg.name}" is required`,
              });
            }
          }
        });
      } else if (step.type === 'interact') {
        // Validate contract source
        if (!step.contractSource || step.contractSource === '') {
          errors.push({
            stepIndex,
            field: 'contractSource',
            message: 'Target contract must be selected',
          });
        }

        // Validate function name
        if (!step.functionName || step.functionName.trim().length === 0) {
          errors.push({
            stepIndex,
            field: 'functionName',
            message: 'Function must be selected',
          });
        }

        // Validate function arguments
        step.functionArgs.forEach((arg, argIndex) => {
          if (typeof arg.value === 'string') {
            if (arg.value.trim().length === 0) {
              errors.push({
                stepIndex,
                field: `arg-${argIndex}`,
                message: `Parameter "${arg.name}" is required`,
              });
            }
          }
        });
      }
    });

    return errors;
  }, [steps]);

  // NEW: Check if a specific step has errors
  const stepHasErrors = (stepIndex: number): boolean => {
    return validateRecipe.some(error => error.stepIndex === stepIndex);
  };

  // NEW: Get error message for a specific field
  const getFieldError = (stepIndex: number, field: string): string | null => {
    const error = validateRecipe.find(
      e => e.stepIndex === stepIndex && e.field === field
    );
    return error ? error.message : null;
  };

  // NEW: Check if save button should be disabled
  const canSave = useMemo(() => {
    return (
      name.trim().length > 0 &&
      steps.length > 0 &&
      validateRecipe.length === 0
    );
  }, [name, steps, validateRecipe]);

  const getAvailableVariables = (currentStepIndex: number) => {
    const variables: { label: string; value: VariableReference }[] = [];
    steps.slice(0, currentStepIndex).forEach((step, index) => {
      if (step.type === 'deploy') {
        variables.push({
          label: `Step ${index + 1}: Contract Address`,
          value: { source: 'step', stepIndex: index, property: 'contractAddress' },
        });
      }
    });
    return variables;
  };

  const addDeployStep = (template: ContractTemplate) => {
    const newStep: DeployStep = {
      type: 'deploy',
      templateId: template.id,
      contractName: template.name,
      constructorArgs: (template.parameters || []).map((param) => ({
        name: param.name,
        type: param.type,
        value: '',
      })),
    };

    setSteps([...steps, newStep]);
    toast.success('Deployment step added', {
      description: `Added ${template.name}`,
    });
  };

  const addInteractStep = () => {
    const newStep: InteractStep = {
      type: 'interact',
      contractSource: '',
      functionName: '',
      functionArgs: [],
      isWrite: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<RecipeStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };
  
  const updateArgValue = (stepIndex: number, argIndex: number, value: string | VariableReference) => {
    const newSteps = [...steps];
    const step = { ...newSteps[stepIndex] };

    if (step.type === 'deploy') {
        const args = [...step.constructorArgs];
        args[argIndex] = { ...args[argIndex], value };
        step.constructorArgs = args;
    } else if (step.type === 'interact') {
        const args = [...step.functionArgs];
        args[argIndex] = { ...args[argIndex], value };
        step.functionArgs = args;
    }

    newSteps[stepIndex] = step;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // NEW: Show validation errors
    if (validateRecipe.length > 0) {
      const firstError = validateRecipe[0];
      toast.error('Recipe has validation errors', {
        description: `Step ${firstError.stepIndex + 1}: ${firstError.message}`,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && initialRecipe) {
        const success = await updateRecipe(initialRecipe.id, {
          name: name.trim(),
          description: description.trim(),
          steps: steps,
        });

        if (success) {
          toast.success('Recipe updated!', { description: `${name} has been saved` });
          onRecipeCreated({
            ...initialRecipe,
            name: name.trim(),
            description: description.trim(),
            steps: steps,
            updated_at: new Date().toISOString(),
          });
          handleClose();
        } else {
          toast.error('Failed to update recipe');
        }
      } else {
        const recipe = await createRecipe({
          name: name.trim(),
          description: description.trim(),
          creator_address: address,
          steps: steps,
          is_public: false,
          tags: [],
        });

        if (recipe) {
          toast.success('Recipe created!', { description: `${name} is ready to use` });
          onRecipeCreated(recipe);
          handleClose();
        } else {
          toast.error('Failed to create recipe');
        }
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} recipe`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setName('');
    setDescription('');
    setSteps([]);
    onClose();
  };

  const renderStepContent = (step: RecipeStep, stepIndex: number) => {
    if (step.type === 'deploy') {
      const template = templates.find((t) => t.id === step.templateId);
      const contractNameError = getFieldError(stepIndex, 'contractName');

      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Contract Name *</Label>
            <Input
              value={step.contractName}
              onChange={(e) => updateStep(stepIndex, { contractName: e.target.value })}
              placeholder="e.g., My Token"
              className={`mt-1 ${contractNameError ? 'border-red-500' : ''}`}
              disabled={isSaving}
            />
            {contractNameError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {contractNameError}
              </p>
            )}
          </div>
          {step.constructorArgs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Parameters</Label>
              {step.constructorArgs.map((arg, argIndex) => {
                const argError = getFieldError(stepIndex, `arg-${argIndex}`);
                return (
                  <div key={argIndex}>
                    <Label className="text-xs text-muted-foreground">{arg.name} ({arg.type}) *</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1">
                        <Input
                          value={typeof arg.value === 'string' ? arg.value : `Var(Step ${arg.value.stepIndex + 1})`}
                          onChange={(e) => updateArgValue(stepIndex, argIndex, e.target.value)}
                          placeholder={`Enter ${arg.name}`}
                          className={argError ? 'border-red-500' : ''}
                          disabled={typeof arg.value !== 'string' || isSaving}
                        />
                        {argError && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {argError}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" disabled={isSaving}>
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {getAvailableVariables(stepIndex).length > 0 ? (
                            getAvailableVariables(stepIndex).map((variable, vIndex) => (
                              <DropdownMenuItem key={vIndex} onSelect={() => updateArgValue(stepIndex, argIndex, variable.value)}>
                                {variable.label}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              No variables available
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'interact') {
        const deployedSteps = steps.slice(0, stepIndex).filter(s => s.type === 'deploy') as DeployStep[];
        const contractSourceError = getFieldError(stepIndex, 'contractSource');
        const functionNameError = getFieldError(stepIndex, 'functionName');
        
        let selectedTemplate: ContractTemplate | undefined;
        if (typeof step.contractSource === 'object') {
            const sourceStep = steps[step.contractSource.stepIndex];
            if (sourceStep.type === 'deploy') {
                selectedTemplate = templates.find(t => t.id === sourceStep.templateId);
            }
        }
        
        const { readFunctions, writeFunctions } = selectedTemplate ? separateFunctions(selectedTemplate.abi) : { readFunctions: [], writeFunctions: [] };
        const allFunctions = [...writeFunctions, ...readFunctions];
        const selectedFunction = allFunctions.find(f => f.name === step.functionName);

        return (
            <div className="space-y-3">
                 <div>
                    <Label className="text-xs">Target Contract *</Label>
                    <Select
                        value={typeof step.contractSource === 'string' ? step.contractSource : step.contractSource ? `step:${step.contractSource.stepIndex}` : ''}
                        onValueChange={(val) => {
                            if (val.startsWith('step:')) {
                                const index = parseInt(val.split(':')[1]);
                                updateStep(stepIndex, { contractSource: { source: 'step', stepIndex: index, property: 'contractAddress' }, functionName: '', functionArgs: [] });
                            } else {
                                updateStep(stepIndex, { contractSource: val, functionName: '', functionArgs: [] });
                            }
                        }}
                        disabled={isSaving}
                    >
                        <SelectTrigger className={`w-full mt-1 ${contractSourceError ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select contract source..." />
                        </SelectTrigger>
                        <SelectContent>
                            {deployedSteps.length > 0 ? (
                              deployedSteps.map((dStep, dIndex) => {
                                // Find the actual index in the full steps array
                                const actualIndex = steps.findIndex((s, i) => i < stepIndex && s === dStep);
                                return (
                                  <SelectItem key={actualIndex} value={`step:${actualIndex}`}>
                                    Step {actualIndex + 1}: {dStep.contractName}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                No deployed contracts available. Add a deploy step first.
                              </div>
                            )}
                        </SelectContent>
                    </Select>
                    {contractSourceError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {contractSourceError}
                      </p>
                    )}
                 </div>

                 {step.contractSource && selectedTemplate && (
                    <div>
                        <Label className="text-xs">Function *</Label>
                        <Select
                            value={step.functionName}
                            onValueChange={(funcName) => {
                                const func = allFunctions.find(f => f.name === funcName);
                                if (func) {
                                    const isWrite = func.stateMutability === 'nonpayable' || func.stateMutability === 'payable';
                                    const newArgs = (func.inputs || []).map(inp => ({ name: inp.name, type: inp.type, value: '' }));
                                    updateStep(stepIndex, { functionName: funcName, functionArgs: newArgs, isWrite });
                                }
                            }}
                            disabled={isSaving}
                        >
                            <SelectTrigger className={`w-full mt-1 ${functionNameError ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select a function..." />
                            </SelectTrigger>
                            <SelectContent>
                                {writeFunctions.length > 0 && <Label className="px-2 text-xs text-muted-foreground">Write</Label>}
                                {writeFunctions.map(f => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}
                                {readFunctions.length > 0 && <Label className="px-2 text-xs text-muted-foreground">Read</Label>}
                                {readFunctions.map(f => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {functionNameError && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {functionNameError}
                          </p>
                        )}
                    </div>
                 )}

                {selectedFunction && step.functionArgs.length > 0 && (
                     <div className="space-y-2 pt-2">
                        <Label className="text-xs font-medium">Parameters</Label>
                        {step.functionArgs.map((arg, argIndex) => {
                          const argError = getFieldError(stepIndex, `arg-${argIndex}`);
                          return (
                            <div key={argIndex}>
                                <Label className="text-xs text-muted-foreground">{arg.name} ({arg.type}) *</Label>
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="flex-1">
                                    <Input
                                        value={typeof arg.value === 'string' ? arg.value : `Var(Step ${arg.value.stepIndex + 1})`}
                                        onChange={(e) => updateArgValue(stepIndex, argIndex, e.target.value)}
                                        placeholder={`Enter ${arg.name}`}
                                        className={argError ? 'border-red-500' : ''}
                                        disabled={typeof arg.value !== 'string' || isSaving}
                                    />
                                    {argError && (
                                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {argError}
                                      </p>
                                    )}
                                  </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" disabled={isSaving}>
                                            <LinkIcon className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                        {getAvailableVariables(stepIndex).map((variable, vIndex) => (
                                            <DropdownMenuItem key={vIndex} onSelect={() => updateArgValue(stepIndex, argIndex, variable.value)}>
                                            {variable.label}
                                            </DropdownMenuItem>
                                        ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                )}
            </div>
        )
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (
              <>
                <Edit className="inline h-5 w-5 mr-2" />
                Edit Recipe
              </>
            ) : (
              'Create Deployment Recipe'
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modify your recipe steps and configuration.'
              : 'Build a repeatable multi-step deployment workflow by chaining deployments and interactions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden pt-4">
          {/* Left: Recipe Config & Templates */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="space-y-4 flex-shrink-0">
              <div>
                <Label htmlFor="recipe-name">Recipe Name *</Label>
                <Input 
                  id="recipe-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., Launch Token Protocol" 
                  className={`mt-1 ${name.trim().length === 0 && steps.length > 0 ? 'border-red-500' : ''}`}
                  disabled={isSaving} 
                />
                {name.trim().length === 0 && steps.length > 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Recipe name is required
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="recipe-description">Description</Label>
                <Textarea id="recipe-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this recipe does..." className="mt-1" rows={3} disabled={isSaving}/>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
                <Label className="mb-2 block flex-shrink-0">Add a Step</Label>
                 <div className="flex border-b mb-2">
                    <button onClick={() => setActiveTab('deploy')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'deploy' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Deploy</button>
                    <button onClick={() => setActiveTab('interact')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'interact' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Interact</button>
                </div>
                 <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4">
                    {activeTab === 'deploy' ? (
                        templates.map((template) => (
                        <Card key={template.id} className="p-3 cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => addDeployStep(template)}>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{template.icon}</span>
                                <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground">{template.category}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                        ))
                    ) : (
                         <Card className="p-3 cursor-pointer hover:bg-accent/10 transition-colors" onClick={addInteractStep}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Send className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-sm">Call a Function</p>
                                        <p className="text-xs text-muted-foreground">Interact with a deployed contract</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    )}
                  </div>
                </ScrollArea>
            </div>
          </div>

          {/* Right: Recipe Steps */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <Label>Recipe Steps ({steps.length})</Label>
              {/* NEW: Validation summary */}
              {validateRecipe.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {validateRecipe.length} error{validateRecipe.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {steps.length === 0 ? (
              <Card className="p-8 text-center border-dashed flex-1 flex flex-col justify-center">
                <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No steps yet. Click on a template or action to add it to your recipe.</p>
              </Card>
            ) : (
              <ScrollArea className="flex-1 -mr-4">
                <div className="space-y-3 pr-4">
                  {steps.map((step, stepIndex) => (
                    <Card 
                      key={stepIndex} 
                      className={`p-4 ${stepHasErrors(stepIndex) ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0 ${stepHasErrors(stepIndex) ? 'bg-red-500/20 text-red-600' : 'bg-primary/10 text-primary'}`}>
                            {stepIndex + 1}
                          </div>
                          <div>
                            <Badge variant={step.type === 'deploy' ? 'secondary' : 'outline'}>{step.type}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.type === 'deploy' ? templates.find(t => t.id === step.templateId)?.name : 'Function Call'}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeStep(stepIndex)} className="text-destructive hover:text-destructive h-8 w-8" disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      {renderStepContent(step, stepIndex)}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
            <Button onClick={handleClose} variant="ghost" disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Recipe' : 'Save Recipe'}
                  </>
                )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}