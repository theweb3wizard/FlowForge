'use client';

import { useState } from 'react';
import { useBatch } from '@/contexts/BatchContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart, Rocket, X } from 'lucide-react';
import { BatchProgressModal } from './BatchProgressModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function BatchCart() {
  const { batchItems, removeFromBatch, updateBatchItem, clearBatch, batchCount } = useBatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleContractNameChange = (itemId: string, name: string) => {
    updateBatchItem(itemId, { contractName: name });
    // Clear validation error when user types
    if (validationErrors[itemId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemId];
        return newErrors;
      });
    }
  };

  const handleConstructorArgChange = (itemId: string, index: number, value: any) => {
    const item = batchItems.find((i) => i.id === itemId);
    if (!item) return;

    const newArgs = [...item.constructorArgs];
    newArgs[index] = value;
    updateBatchItem(itemId, { constructorArgs: newArgs });
  };

  const validateBatch = (): boolean => {
    const errors: Record<string, string> = {};

    batchItems.forEach((item) => {
      // Validate contract name
      if (!item.contractName.trim()) {
        errors[item.id] = 'Contract name is required';
        return;
      }

      // Validate constructor args
      const templateParams = Array.isArray(item.template.parameters) ? item.template.parameters : [];
      if (templateParams.length > 0 && item.constructorArgs.length !== templateParams.length) {
        errors[item.id] = 'All parameters must be filled';
        return;
      }

      // Validate each parameter is not empty
      templateParams.forEach((param, idx) => {
        if (!item.constructorArgs[idx] || item.constructorArgs[idx].toString().trim() === '') {
          errors[item.id] = `Parameter "${param.name}" is required`;
        }
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeployBatch = () => {
    if (!validateBatch()) {
      return;
    }
    setShowProgressModal(true);
    setIsOpen(false);
  };

  if (batchCount === 0) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button variant="outline" size="lg" className="rounded-full shadow-lg" disabled>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Batch Deploy
          <Badge variant="secondary" className="ml-2">0</Badge>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg relative">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Batch Deploy
              <Badge variant="secondary" className="ml-2 bg-white text-primary">
                {batchCount}
              </Badge>
              {batchCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Batch Deployment Queue
              </SheetTitle>
              <SheetDescription>
                Configure each contract and deploy them all sequentially.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {batchItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your batch is empty</p>
                  <p className="text-sm">Click "Add to Batch" on any template to start</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-4 pr-4">
                      {batchItems.map((item, index) => {
                        const templateParams = Array.isArray(item.template.parameters)
                          ? item.template.parameters
                          : [];
                        const hasError = !!validationErrors[item.id];

                        return (
                          <Card
                            key={item.id}
                            className={`p-4 ${hasError ? 'border-destructive' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{item.template.icon}</span>
                                    <h3 className="font-medium">{item.template.name}</h3>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {item.template.category}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromBatch(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {hasError && (
                              <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                {validationErrors[item.id]}
                              </div>
                            )}

                            <div className="space-y-3">
                              {/* Contract Name */}
                              <div>
                                <Label htmlFor={`name-${item.id}`} className="text-xs">
                                  Contract Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`name-${item.id}`}
                                  value={item.contractName}
                                  onChange={(e) =>
                                    handleContractNameChange(item.id, e.target.value)
                                  }
                                  placeholder="e.g., My Token"
                                  className="mt-1"
                                />
                              </div>

                              {/* Constructor Parameters */}
                              {templateParams.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">Parameters</Label>
                                  {templateParams.map((param, paramIndex) => (
                                    <div key={paramIndex}>
                                      <Label
                                        htmlFor={`${item.id}-param-${paramIndex}`}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {param.name} ({param.type})
                                      </Label>
                                      <Input
                                        id={`${item.id}-param-${paramIndex}`}
                                        value={item.constructorArgs[paramIndex] || ''}
                                        onChange={(e) =>
                                          handleConstructorArgChange(
                                            item.id,
                                            paramIndex,
                                            e.target.value
                                          )
                                        }
                                        placeholder={param.placeholder || param.description}
                                        className="mt-1"
                                      />
                                      {param.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {param.description}
                                        </p>
                                      )}
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

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total contracts:</span>
                      <span className="font-semibold">{batchCount}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeployBatch}
                        className="flex-1"
                        size="lg"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy All ({batchCount})
                      </Button>
                      <Button
                        onClick={clearBatch}
                        variant="outline"
                        size="lg"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll be prompted to sign each transaction individually in your wallet.
                    </p>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {showProgressModal && (
        <BatchProgressModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </>
  );
}