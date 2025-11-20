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
import { useWalletClient, usePublicClient } from 'wagmi';
import { erc20Bytecode, erc20Abi } from '@/lib/abis/erc20';
import { parseEther } from 'viem';

type Step = 'form' | 'pending' | 'success' | 'error' | 'no_wallet';

const PENDING_MESSAGES: { [key: number]: string } = {
  0: "Transaction Submitted...",
  15: "Propagating to BlockDAG Network...",
  50: "Awaiting Final Confirmation...",
  95: "Finalizing...",
};

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
        shape[param.name] = z.string().min(1, 'Required').regex(/^\d+(\.\d+)?$/, 'Must be a number');
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
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [pendingMessage, setPendingMessage] = useState(PENDING_MESSAGES[0]);

  const { address, connectors, connect } = useWallet();
  const { addDeployment } = useDeployments();
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
      setDeployedAddress('');
      setTxHash(null);
      setErrorMessage('');
      setProgress(0);
      setPendingMessage(PENDING_MESSAGES[0]);
    }
  }, [open, address, form, template]);

  // Effect for progress bar animation
  useEffect(() => {
    if (step !== 'pending' || !txHash) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 99; // Cap at 99 until success
        }

        const messageKey = Object.keys(PENDING_MESSAGES)
          .map(Number)
          .filter(k => k <= newProgress)
          .pop() ?? 0;
        setPendingMessage(PENDING_MESSAGES[messageKey]);
        
        return newProgress;
      });
    }, 1800); // Fills up in ~3 minutes (180 seconds)

    return () => clearInterval(interval);
  }, [step, txHash]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!walletClient || !publicClient) {
      setErrorMessage('Wallet client not available. Please ensure your wallet is connected.');
      setStep('error');
      return;
    }

    setStep('pending');
    setProgress(5);

    try {
      let args: any[] = [];
      if (template.id === 'erc20') {
        args = [values.tokenName, values.tokenSymbol, parseEther(values.initialSupply)];
      } else {
        args = template.parameters.map(p => values[p.name]);
      }
      
      const hash = await walletClient.deployContract({
        abi: erc20Abi,
        bytecode: erc20Bytecode,
        args: args,
        gas: 5000000n, // Manual gas limit
        gasPrice: 1000000000n, // 1 gwei
      });

      setTxHash(hash);
      setProgress(15); // Move to next stage after tx is sent

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 300_000,
        pollingInterval: 5_000,
      });

      setProgress(100);

      if (receipt.status === 'success' && receipt.contractAddress) {
        const newAddress = receipt.contractAddress;
        setDeployedAddress(newAddress);
        await addDeployment({
          "contractName": template.name,
          address: newAddress,
          deployer: address!,
          transactionHash: hash,
        });
        setStep('success');
      } else {
        throw new Error('Transaction failed or contract address not found.');
      }
    } catch (e: any) {
      console.error(e);
      let message = e.shortMessage || e.message || 'An unknown error occurred.';
      if (e.name === 'TimeoutError') {
        message = `Transaction confirmation timed out. It may still succeed. Please check the explorer.`;
      }
      setErrorMessage(message);
      setStep('error');
    }
  }
  
  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const explorerUrl = process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL;

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
              <DialogDescription>
                {!txHash
                  ? 'Please confirm the transaction in your wallet.'
                  : 'Your contract is being deployed to the BlockDAG testnet.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              {!txHash ? (
                 <Loader2 className="h-16 w-16 animate-spin text-primary" />
              ) : (
                <Progress value={progress} className="w-full" />
              )}
              <p className="text-sm text-muted-foreground text-center min-h-[40px] flex items-center justify-center">
                {!txHash
                  ? 'Waiting for wallet confirmation...'
                  : pendingMessage
                }
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
               <div className="text-sm bg-muted rounded-md p-3 font-mono break-all text-left">
                  <p className="font-semibold text-muted-foreground">Contract Address:</p>
                  <p>{deployedAddress}</p>
               </div>
               {explorerUrl && txHash && (
                 <Button variant="outline" asChild className="w-full">
                    <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
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
            {txHash && explorerUrl && (
              <Button variant="link" asChild>
                <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  View transaction details on explorer
                </a>
              </Button>
            )}
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
