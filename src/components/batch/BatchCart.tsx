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
      if (!item.contractName.trim()) {
        errors[item.id] = 'Contract name is required';
        return;
      }

      const templateParams = Array.isArray(item.template.parameters) ? item.template.parameters : [];
      if (templateParams.length > 0 && item.constructorArgs.length !== templateParams.length) {
        errors[item.id] = 'All parameters must be filled';
        return;
      }

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
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-lg h-12 sm:h-auto px-4 sm:px-6" 
          disabled
        >
          <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Batch Deploy</span>
          <span className="sm:hidden">Batch</span>
          <Badge variant="secondary" className="ml-2">0</Badge>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg relative h-12 sm:h-auto px-4 sm:px-6">
              <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Batch Deploy</span>
              <span className="sm:hidden">Batch</span>
              <Badge variant="secondary" className="ml-2 bg-white text-primary text-xs sm:text-sm">
                {batchCount}
              </Badge>
              {batchCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-primary"></span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-full sm:w-[540px] md:max-w-2xl overflow-y-auto p-4 sm:p-6"
          >
            <SheetHeader className="space-y-2 sm:space-y-3">
              <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="truncate">Batch Deployment Queue</span>
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                Configure each contract and deploy them all sequentially.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              {batchItems.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Your batch is empty</p>
                  <p className="text-xs sm:text-sm mt-1">Click "Add to Batch" on any template to start</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
                    <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-4">
                      {batchItems.map((item, index) => {
                        const templateParams = Array.isArray(item.template.parameters)
                          ? item.template.parameters
                          : [];
                        const hasError = !!validationErrors[item.id];

                        return (
                          <Card
                            key={item.id}
                            className={`p-3 sm:p-4 ${hasError ? 'border-destructive' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-lg sm:text-2xl flex-shrink-0">{item.template.icon}</span>
                                    <h3 className="font-medium text-sm sm:text-base truncate">{item.template.name}</h3>
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                    {item.template.category}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromBatch(item.id)}
                                className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 ml-2"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>

                            {hasError && (
                              <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs sm:text-sm text-destructive">
                                {validationErrors[item.id]}
                              </div>
                            )}

                            <div className="space-y-2.5 sm:space-y-3">
                              {/* Contract Name */}
                              <div>
                                <Label htmlFor={`name-${item.id}`} className="text-xs sm:text-sm">
                                  Contract Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`name-${item.id}`}
                                  value={item.contractName}
                                  onChange={(e) =>
                                    handleContractNameChange(item.id, e.target.value)
                                  }
                                  placeholder="e.g., My Token"
                                  className="mt-1 h-9 sm:h-10 text-sm"
                                />
                              </div>

                              {/* Constructor Parameters */}
                              {templateParams.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs sm:text-sm font-medium">Parameters</Label>
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
                                        className="mt-1 h-9 sm:h-10 text-sm"
                                      />
                                      {param.description && (
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
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

                  <div className="border-t pt-3 sm:pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Total contracts:</span>
                      <span className="font-semibold">{batchCount}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleDeployBatch}
                        className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                        size="lg"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy All ({batchCount})
                      </Button>
                      <Button
                        onClick={clearBatch}
                        variant="outline"
                        className="sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
                        size="lg"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-2">
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