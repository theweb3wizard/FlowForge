
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { Abi } from 'viem';
import { isAddress, parseEther } from 'viem';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ParsedAbiFunction, formatResult } from '@/lib/abi-utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, AlertCircle, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

interface FunctionFormProps {
  func: ParsedAbiFunction;
  address: `0x${string}`;
  abi: Abi;
}

// Helper to generate a Zod schema from function inputs
const generateSchema = (func: ParsedAbiFunction) => {
  const shape: { [key: string]: z.ZodType<any, any> } = {};
  func.inputs.forEach(input => {
    let schema = z.string().min(1, { message: 'This field is required.' });
    if (input.type === 'address') {
      schema = schema.refine(isAddress, { message: 'Invalid address format.' });
    } else if (input.type.includes('uint') || input.type.includes('int')) {
       schema = schema.regex(/^[0-9]+$/, { message: 'Must be a valid integer.' });
    }
    shape[input.name] = schema;
  });
  if (func.payable) {
     shape['value'] = z.string().min(1, { message: 'This field is required.' }).regex(/^[0-9]*\.?[0-9]+$/, { message: 'Must be a valid number.'});
  }
  return z.object(shape);
}

export function FunctionForm({ func, address, abi }: FunctionFormProps) {
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formSchema = generateSchema(func);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change to enable button
    defaultValues: func.inputs.reduce((acc, input) => ({ ...acc, [input.name]: '' }), {}),
  });

  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleExecute = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const args = func.inputs.map((input: any) => {
        let value = values[input.name];
        if (input.type.includes('uint') || input.type.includes('int')) {
            try {
                // For payable functions, the main value is handled separately.
                // Here, we just need to convert other uint args to BigInt.
                if (input.type === 'uint256' && func.name === 'approve') { // A common case
                    return parseEther(value);
                }
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleExecute)} className="space-y-4 p-2">
            {func.inputs.map((input: any) => (
                <FormField
                    key={input.name}
                    control={form.control}
                    name={input.name}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{input.name} <span className="text-xs text-muted-foreground">({input.type})</span></FormLabel>
                        <FormControl>
                        <Input placeholder={input.type} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            ))}
            {func.payable && (
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>value <span className="text-xs text-muted-foreground">(ether)</span></FormLabel>
                            <FormControl>
                                <Input placeholder="uint256" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <Button type="submit" disabled={loading || !form.formState.isValid}>
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
        </Form>
      </AccordionContent>
    </AccordionItem>
  );
}
