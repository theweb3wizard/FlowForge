"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from "@/components/ui/progress";
import { Confetti } from '../common/Confetti';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type ContractTemplate } from '@/lib/contracts';
import { useWallet } from '@/contexts/WalletContext';
import { useDeployments } from '@/contexts/DeploymentContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Step = 'form' | 'pending' | 'success' | 'error' | 'no_wallet';

interface DeploymentWizardProps {
  template: ContractTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const generateSchema = (template: ContractTemplate) => {
  const shape: { [key: string]: z.ZodType<any, any> } = {};
  template.parameters.forEach(param => {
    switch (param.type) {
      case 'number':
        shape[param.name] = z.string().min(1, 'Required').regex(/^\d+$/, 'Must be a number');
        break;
      case 'address':
        shape[param.name] = z.string().min(1, 'Required').regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');
        break;
      default:
        shape[param.name] = z.string().min(1, 'Required');
    }
  });
  return z.object(shape);
};

export function DeploymentWizard({ template, open, onOpenChange }: DeploymentWizardProps) {
  const [step, setStep] = useState<Step>('form');
  const [progress, setProgress] = useState(0);
  const [deployedAddress, setDeployedAddress] = useState('');
  const { address, connect } = useWallet();
  const { addDeployment } = useDeployments();

  const formSchema = generateSchema(template);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: template.parameters.reduce((acc, param) => ({ ...acc, [param.name]: '' }), {}),
  });

  useEffect(() => {
    if (open) {
      if (!address) {
        setStep('no_wallet');
      } else {
        setStep('form');
      }
      form.reset();
      setProgress(0);
      setDeployedAddress('');
    }
  }, [open, address, form, template]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'pending' && progress < 100) {
      timer = setTimeout(() => setProgress(prev => Math.min(prev + Math.random() * 20, 100)), 500);
    }
    return () => clearTimeout(timer);
  }, [step, progress]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setStep('pending');
    
    // Simulate deployment
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      if (isSuccess) {
        const newAddress = `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setDeployedAddress(newAddress);
        addDeployment({
          contractName: template.name,
          address: newAddress,
          deployer: address!,
        });
        setStep('success');
      } else {
        setStep('error');
      }
    }, 5000); // 5 second simulation
  }

  const renderContent = () => {
    switch (step) {
      case 'no_wallet':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>You need to connect your wallet before deploying a contract.</DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center">
              <Button onClick={connect}>Connect Wallet</Button>
            </div>
          </>
        );
      case 'form':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Deploy: {template.name}</DialogTitle>
              <DialogDescription>Fill in the parameters to deploy your contract.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                {template.parameters.map(param => (
                  <FormField
                    key={param.name}
                    control={form.control}
                    name={param.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{param.label}</FormLabel>
                        <FormControl>
                          <Input placeholder={param.placeholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <DialogFooter>
                  <Button type="submit">Deploy Contract</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
      case 'pending':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Deployment in Progress</DialogTitle>
              <DialogDescription>Your contract is being deployed to the BlockDAG testnet. Please wait...</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          </>
        );
      case 'success':
        return (
          <>
            <Confetti />
            <DialogHeader className="text-center">
              <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full h-16 w-16 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="mt-4">Deployment Successful!</DialogTitle>
              <DialogDescription>Your {template.name} contract is live.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div className="text-sm bg-muted rounded-md p-3 font-mono break-all">
                  <span className="font-semibold text-muted-foreground">Address:</span> {deployedAddress}
               </div>
               <Button asChild className="w-full">
                <Link href="/dashboard" onClick={() => onOpenChange(false)}>
                  View on Dashboard
                </Link>
               </Button>
            </div>
          </>
        );
      case 'error':
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto bg-red-100 dark:bg-red-900 rounded-full h-16 w-16 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="mt-4">Deployment Failed</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive" className="my-4">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                The contract could not be deployed. Please check your parameters and wallet balance, then try again.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('form')}>Back to Form</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md transition-all duration-300">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
