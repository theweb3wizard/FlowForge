
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { onboardContract } from '@/ai/flows/onboard-contract-flow';
import { compileContract } from '@/ai/flows/compile-solidity-flow';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [solidityCode, setSolidityCode] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateTemplate = async () => {
    if (!solidityCode || !templateName) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please provide both a template name and the Solidity code.',
      });
      return;
    }
    
    setLoading(true);
    toast({
      title: 'Generation Started',
      description: 'The AI is analyzing and compiling your smart contract...',
    });

    try {
      // Step 1: Get metadata and the source contract name from the AI
      const metadataResult = await onboardContract({
        templateName: templateName,
        solidityCode: solidityCode,
      });

      console.log('AI Analysis Result:', metadataResult);

      // Step 2: Use the extracted source contract name to compile
      const compilationResult = await compileContract({
        sourceContractName: metadataResult.sourceContractName,
        solidityCode: solidityCode,
      });

      console.log('Compilation Result:', compilationResult);

      toast({
        title: 'Analysis & Compilation Complete!',
        description: `Successfully processed ${templateName}. Check the console for output.`,
      });

      // In the next step, we will use these results to generate the files.
      // For now, we'll just log them.

    } catch (error: any) {
      console.error('Error during AI processing:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error.message || 'The AI could not process the contract. Please check the logs.',
      });
    } finally {
      setLoading(false);
    }
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
            Provide the template display name and the full Solidity code. The AI will handle the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              placeholder="e.g., Simple Multi-Sig Wallet"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={loading}
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
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateTemplate} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing & Compiling...</> : 'Generate Template'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
