
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Deployment } from '@/lib/deployments';
import { notFound, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ContractInteractionPanel } from '@/components/contract/ContractInteractionPanel';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { isAddress } from 'viem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { erc20Abi } from '@/lib/abis/erc20';

interface ContractPageProps {
  params: {
    address: string;
  };
}

export default function ContractPage({ params }: ContractPageProps) {
  const { address } = params;
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const explorerUrl = process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL;
  const router = useRouter();

  useEffect(() => {
    const fetchDeployment = async () => {
      if (!isAddress(address)) {
        setError("Invalid contract address provided in the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('deployments')
        .select('*')
        .eq('address', address)
        .single();

      if (dbError || !data) {
        console.error('Error fetching deployment:', dbError?.message);
        setDeployment(null);
      } else {
        // This is the temporary, last piece of hardcoded logic.
        // In the future, the ABI will be fetched from a `contract_templates` table
        // based on a template ID stored in the `deployments` record.
        const deploymentData = data as Deployment;
        if (deploymentData.contractName.includes('ERC-20')) {
            deploymentData.abi = erc20Abi;
        } else {
            deploymentData.abi = []; // Default to empty ABI if unknown
        }
        setDeployment(deploymentData);
      }
      setLoading(false);
    };

    fetchDeployment();
  }, [address]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
         <div className="container mx-auto px-4 py-12">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
             <Button onClick={() => router.push('/dashboard')} variant="outline" className="mt-4">
                Return to Dashboard
            </Button>
         </div>
    )
  }

  if (!deployment) {
    notFound();
  }

  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: `${entity}: ${text.slice(0, 20)}...`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-2">
          {deployment.contractName}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <p className="font-mono text-lg">{deployment.address}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(deployment.address, 'Address')}>
            <Copy className="h-4 w-4" />
          </Button>
          {explorerUrl && (
             <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <a href={`${explorerUrl}/address/${deployment.address}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                </a>
             </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <ContractInteractionPanel deployment={deployment} />
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Deployment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="font-semibold text-muted-foreground">Contract Type</p>
                        <p>{deployment.contractName}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-muted-foreground">Deployer</p>
                        <p className="font-mono break-all">{deployment.deployer}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-muted-foreground">Transaction Hash</p>
                        <p className="font-mono break-all">{deployment.transactionHash || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Deployed</p>
                        <p>{formatDistanceToNow(new Date(deployment.timestamp), { addSuffix: true })}</p>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
