
"use client";

import { useMemo } from 'react';
import type { Deployment } from '@/lib/deployments';
import { erc20Abi } from '@/lib/abis/erc20';
import { parseContractAbi } from '@/lib/abi-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { FunctionForm } from './FunctionForm';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ContractInteractionPanelProps {
  deployment: Deployment;
}

export function ContractInteractionPanel({ deployment }: ContractInteractionPanelProps) {
  const abi = useMemo(() => {
    return deployment.contractName.includes('ERC-20') ? erc20Abi : [];
  }, [deployment.contractName]);

  const { reads, writes } = useMemo(() => parseContractAbi(abi), [abi]);

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
