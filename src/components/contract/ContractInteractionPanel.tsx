
"use client";

import { useMemo } from 'react';
import type { Deployment } from '@/lib/deployments';
import { parseContractAbi } from '@/lib/abi-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { FunctionForm } from './FunctionForm';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Abi } from 'viem';

interface ContractInteractionPanelProps {
  deployment: Deployment;
}

export function ContractInteractionPanel({ deployment }: ContractInteractionPanelProps) {
  const abi = useMemo(() => deployment.abi as Abi | undefined, [deployment.abi]);

  const { reads, writes } = useMemo(() => {
    if (!abi) return { reads: [], writes: [] };
    return parseContractAbi(abi);
  }, [abi]);

  if (!abi || abi.length === 0) {
      return (
           <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>ABI Not Found</AlertTitle>
                <AlertDescription>
                    Could not load the ABI for this contract. Interaction is not possible.
                </AlertDescription>
            </Alert>
      )
  }

  return (
    <Tabs defaultValue="read" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="read">Read Contract</TabsTrigger>
        <TabsTrigger value="write">Write Contract</TabsTrigger>
      </TabsList>
      <TabsContent value="read">
        <Card>
          <CardHeader>
            <CardTitle>Read Functions</CardTitle>
            <CardDescription>
              Query view and pure functions on the contract. These calls do not cost gas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reads.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                {reads.map((func) => (
                    <FunctionForm key={func.name} func={func} address={deployment.address as `0x${string}`} abi={abi} />
                ))}
                </Accordion>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No Read Functions</AlertTitle>
                    <AlertDescription>This contract interface has no read-only functions.</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="write">
         <Card>
          <CardHeader>
            <CardTitle>Write Functions</CardTitle>
            <CardDescription>
              Execute state-changing functions. These calls require a wallet signature and will cost gas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {writes.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                {writes.map((func) => (
                    <FunctionForm key={func.name} func={func} address={deployment.address as `0x${string}`} abi={abi} />
                ))}
                </Accordion>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No Write Functions</AlertTitle>
                    <AlertDescription>This contract interface has no state-changing functions.</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
