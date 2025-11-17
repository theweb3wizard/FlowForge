"use client";

import React from 'react';
import { useDeployments } from '@/contexts/DeploymentContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export default function DeploymentTable() {
  const { deployments, loading } = useDeployments();
  const { toast } = useToast();
  const explorerUrl = process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: text,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deployments.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No deployments yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Deployer</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead className="text-right">Deployed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">{dep.contractName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{`${dep.address.slice(0, 10)}...${dep.address.slice(-8)}`}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dep.address)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{`${dep.deployer.slice(0, 10)}...${dep.deployer.slice(-8)}`}</span>
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dep.deployer)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {explorerUrl && dep.transactionHash && (
                       <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                         <a href={`${explorerUrl}/tx/${dep.transactionHash}`} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="h-4 w-4" />
                         </a>
                       </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDistanceToNow(new Date(dep.timestamp), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {deployments.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold">{dep.contractName}</p>
                    {explorerUrl && dep.transactionHash && (
                       <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" asChild>
                         <a href={`${explorerUrl}/tx/${dep.transactionHash}`} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="h-4 w-4" />
                         </a>
                       </Button>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-mono break-all">{dep.address}</p>
                    <p className="font-mono break-all mt-1">{dep.deployer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    {formatDistanceToNow(new Date(dep.timestamp), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
