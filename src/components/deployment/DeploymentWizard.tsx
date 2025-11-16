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
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { erc20Bytecode, erc20Abi } from '@/lib/abis/erc20';
import { parseEther } from 'viem';


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
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { address, connectors, connect } = useWallet();
  const { addDeployment } = useDeployments();
  const { chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

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
      setTxHash(null);
      setErrorMessage('');
    }
  }, [open, address, form, template]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!walletClient || !publicClient || !chain) {
      setErrorMessage('Wallet client not available. Please ensure your wallet is connected.');
      setStep('error');
      return;
    }

    setStep('pending');
    setProgress(10);

    try {
      let args: any[] = [];
      if (template.id === 'erc20') {
        // Specifically for ERC20, convert supply to the right format (wei)
        args = [values.tokenName, values.tokenSymbol, parseEther(values.initialSupply)];
      } else {
        // Fallback for other potential contracts
        args = template.parameters.map(p => values[p.name]);
      }
      
      setProgress(25);
      const hash = await walletClient.deployContract({
        abi: erc20Abi,
        bytecode: erc20Bytecode,
        args: args,
      });
      setTxHash(hash);
      setProgress(50);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setProgress(100);

      if (receipt.status === 'success' && receipt.contractAddress) {
        const newAddress = receipt.contractAddress;
        setDeployedAddress(newAddress);
        await addDeployment({
          contractName: template.name,
          address: newAddress,
          deployer: address!,
        });
        setStep('success');
      } else {
        throw new Error('Transaction failed or contract address not found.');
      }
    } catch (e: any) {
      console.error(e);
      const message = e.shortMessage || e.message || 'An unknown error occurred.';
      setErrorMessage(message);
      setStep('error');
    }
  }
  
  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const explorerUrl = chain?.blockExplorers?.default.url;

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
              <Button onClick={handleConnect}>Connect Wallet</Button>
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
                  <Button type="submit" disabled={!walletClient}>Deploy Contract</Button>
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
              <p className="text-sm text-muted-foreground">
                {progress < 50 ? 'Waiting for wallet confirmation...' : 'Deploying contract...'}
              </p>
              {txHash && explorerUrl && (
                <Button variant="link" asChild>
                  <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                    View Transaction on Explorer
                  </a>
                </Button>
              )}
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
               {explorerUrl && (
                 <Button variant="outline" asChild className="w-full">
                    <a href={`${explorerUrl}/address/${deployedAddress}`} target="_blank" rel="noopener noreferrer">
                      View on Explorer
                    </a>
                 </Button>
               )}
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
              <AlertDescription className="break-words">
                {errorMessage || 'The contract could not be deployed. Please check your wallet and try again.'}
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('form')}>Try Again</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
