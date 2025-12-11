
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [solidityCode, setSolidityCode] = useState('');
  const [contractName, setContractName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateTemplate = () => {
    if (!solidityCode || !contractName) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please provide both a contract name and the Solidity code.',
      });
      return;
    }
    
    setLoading(true);
    console.log('Generating template for:', contractName);
    console.log('Solidity Code:', solidityCode);

    // In the next step, we will replace this with a call to our AI flow.
    setTimeout(() => {
      toast({
        title: 'Generation Started',
        description: 'The AI is analyzing the contract. This is a placeholder for the real flow.',
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-2">
          Add New Contract Template
        </h1>
        <p className="text-lg text-muted-foreground">
          Use the AI-powered onboarder to add new deployable smart contracts to FlowForge.
        </p>
      </header>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Contract Onboarding</CardTitle>
          <CardDescription>
            Provide the Solidity code and a name for your contract. The AI will handle the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contractName">Contract Name</Label>
            <Input
              id="contractName"
              placeholder="e.g., Simple Multisig Wallet"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solidityCode">Solidity Code</Label>
            <Textarea
              id="solidityCode"
              placeholder="// SPDX-License-Identifier: MIT..."
              className="min-h-[300px] font-mono text-xs"
              value={solidityCode}
              onChange={(e) => setSolidityCode(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateTemplate} disabled={loading} className="w-full">
            {loading ? 'Analyzing...' : 'Generate Template'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
