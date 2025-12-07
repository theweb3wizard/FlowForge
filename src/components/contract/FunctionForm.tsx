
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { Abi } from 'viem';
import { parseEther } from 'viem';

import { ParsedAbiFunction, formatResult } from '@/lib/abi-utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, AlertCircle, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface FunctionFormProps {
  func: ParsedAbiFunction;
  address: `0x${string}`;
  abi: Abi;
}

export function FunctionForm({ func, address, abi }: FunctionFormProps) {
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, getValues } = useForm();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const values = getValues();
      const args = func.inputs.map((input: any) => {
        let value = values[input.name];
        // Handle uint256 conversion from ether to wei if needed
        if (input.type === 'uint256' && func.payable) {
            try {
                return parseEther(value);
            } catch {
                // Ignore if it's not a valid number string for payable amounts
            }
        }
         if (input.type.includes('uint') || input.type.includes('int')) {
            try {
                return BigInt(value);
            } catch {}
        }
        return value;
      });

      if (func.type === 'read') {
        const data = await publicClient.readContract({
          address,
          abi,
          functionName: func.name,
          args: args.length > 0 ? args : undefined,
        });
        setResult(formatResult(data));
        toast({ title: "Query Successful", description: `Result for ${func.name} retrieved.` });
      } else { // 'write'
        if (!walletClient) {
          throw new Error('Wallet not connected.');
        }
        const hash = await walletClient.writeContract({
          address,
          abi,
          functionName: func.name,
          args: args.length > 0 ? args : undefined,
          value: func.payable ? parseEther(values.value || '0') : undefined,
        });
        setResult(`Transaction sent! Hash: ${hash}`);
        toast({ title: "Transaction Sent", description: `Hash: ${hash.slice(0,20)}...` });
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.shortMessage || e.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Execution Failed", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccordionItem value={func.name}>
      <AccordionTrigger>{func.name}</AccordionTrigger>
      <AccordionContent>
        <form onSubmit={handleSubmit(handleExecute)} className="space-y-4 p-2">
          {func.inputs.map((input: any) => (
            <div key={input.name} className="space-y-1">
              <Label htmlFor={`${func.name}-${input.name}`}>{input.name} <span className="text-xs text-muted-foreground">({input.type})</span></Label>
              <Input
                id={`${func.name}-${input.name}`}
                placeholder={input.type}
                {...register(input.name)}
              />
            </div>
          ))}
          {func.payable && (
             <div className="space-y-1">
              <Label htmlFor={`${func.name}-value`}>value <span className="text-xs text-muted-foreground">(ether)</span></Label>
              <Input
                id={`${func.name}-value`}
                placeholder="uint256"
                {...register('value')}
              />
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {func.type === 'read' ? 'Query' : 'Execute'}
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
           )}

          {result && !error && (
            <Alert className="mt-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Result</AlertTitle>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap break-all">{result}</pre>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </AccordionContent>
    </AccordionItem>
  );
}
