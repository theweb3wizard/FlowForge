'use client';

import { useState } from 'react';
import { Recipe, RecipeStep, DeployStep } from '@/types/recipe';
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
} from '@/components/ui/dialog';
import { Plus, Trash2, Layers, Save } from 'lucide-react';
import { createRecipe } from '@/lib/supabase/recipes';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

interface SimpleRecipeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ContractTemplate[];
  onRecipeCreated: (recipe: Recipe) => void;
}

export function SimpleRecipeBuilder({
  isOpen,
  onClose,
  templates,
  onRecipeCreated,
}: SimpleRecipeBuilderProps) {
  const { address } = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<DeployStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    toast.success('Step added', {
      description: `Added ${template.name} deployment`,
    });
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStepName = (index: number, contractName: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], contractName };
    setSteps(newSteps);
  };

  const updateStepArg = (stepIndex: number, argIndex: number, value: string) => {
    const newSteps = [...steps];
    const step = { ...newSteps[stepIndex] };
    const args = [...step.constructorArgs];
    args[argIndex] = { ...args[argIndex], value };
    step.constructorArgs = args;
    newSteps[stepIndex] = step;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    // Validate all steps have required data
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.contractName.trim()) {
        toast.error(`Step ${i + 1}: Contract name is required`);
        return;
      }

      for (let j = 0; j < step.constructorArgs.length; j++) {
        const arg = step.constructorArgs[j];
        if (!arg.value || arg.value.toString().trim() === '') {
          toast.error(`Step ${i + 1}: Parameter "${arg.name}" is required`);
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const recipe = await createRecipe({
        name: name.trim(),
        description: description.trim(),
        creator_address: address,
        steps: steps as RecipeStep[],
        is_public: false,
        tags: [],
      });

      if (recipe) {
        toast.success('Recipe created!', {
          description: `${name} is ready to use`,
        });
        onRecipeCreated(recipe);
        handleClose();
      } else {
        toast.error('Failed to create recipe');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSteps([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Deployment Recipe</DialogTitle>
          <DialogDescription>
            Build a repeatable multi-step deployment workflow
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left: Recipe Config */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipe-name">Recipe Name *</Label>
                <Input
                  id="recipe-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Launch Token Protocol"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="recipe-description">Description</Label>
                <Textarea
                  id="recipe-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this recipe does..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label className="mb-2 block">Available Templates</Label>
                <ScrollArea className="h-[400px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addDeployStep(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{template.icon}</span>
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {template.category}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right: Recipe Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Recipe Steps ({steps.length})</Label>
                {steps.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Recipe'}
                  </Button>
                )}
              </div>

              {steps.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No steps yet. Click on a template to add it to your recipe.
                  </p>
                </Card>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {steps.map((step, stepIndex) => {
                      const template = templates.find((t) => t.id === step.templateId);

                      return (
                        <Card key={stepIndex} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {stepIndex + 1}
                              </div>
                              <div className="flex items-center gap-2">
                                {template && <span className="text-xl">{template.icon}</span>}
                                <div>
                                  <Badge variant="secondary">Deploy</Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {template?.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(stepIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Contract Name *</Label>
                              <Input
                                value={step.contractName}
                                onChange={(e) => updateStepName(stepIndex, e.target.value)}
                                placeholder="e.g., My Token"
                                className="mt-1"
                              />
                            </div>

                            {step.constructorArgs.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Parameters</Label>
                                {step.constructorArgs.map((arg, argIndex) => (
                                  <div key={argIndex}>
                                    <Label className="text-xs text-muted-foreground">
                                      {arg.name} ({arg.type}) *
                                    </Label>
                                    <Input
                                      value={arg.value as string}
                                      onChange={(e) =>
                                        updateStepArg(stepIndex, argIndex, e.target.value)
                                      }
                                      placeholder={`Enter ${arg.name}`}
                                      className="mt-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}