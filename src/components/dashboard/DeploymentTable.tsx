
"use client";

import React, { useState, useEffect } from 'react';
import { useDeployments, Deployment } from '@/contexts/DeploymentContext';
import { supabase } from '@/lib/supabase';
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
import { Copy, ExternalLink, FileJson, ChevronsRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { erc20Abi } from '@/lib/abis/erc20';
import { CONTRACT_TEMPLATES } from '@/lib/contracts';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function DeploymentTable() {
  const { newDeployment } = useDeployments();
  const { toast } = useToast();
  const explorerUrl = process.env.NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL;
  
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const countPromise = supabase.from('deployments').select('*', { count: 'exact', head: true });
      const dataPromise = supabase
        .from('deployments')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(from, to);

      const [countResult, dataResult] = await Promise.all([countPromise, dataPromise]);

      if (countResult.error) {
        console.error('Error fetching deployment count:', countResult.error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch deployment count.' });
      } else {
        setTotalCount(countResult.count || 0);
      }

      if (dataResult.error) {
        console.error('Error fetching deployments:', dataResult.error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch deployments.' });
      } else {
        setDeployments(dataResult.data as Deployment[]);
      }

      setLoading(false);
    };

    fetchDeployments();
  }, [currentPage, toast]);

  useEffect(() => {
    if (newDeployment) {
        if (currentPage === 1) {
            setDeployments(prev => [newDeployment, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotalCount(prev => prev + 1);
        } else {
            toast({
                title: "New Deployment Created",
                description: "A new contract has been deployed. Go to the first page to see it.",
            });
        }
    }
  }, [newDeployment, currentPage, toast]);


  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: `${entity}: ${text.slice(0, 20)}...`,
    });
  };

  const handleCopyAbi = async (contractName: string) => {
    const template = CONTRACT_TEMPLATES.find(t => t.name === contractName);
    if (!template) {
      toast({ variant: 'destructive', title: 'Error', description: 'ABI not found for this contract type.' });
      return;
    }

    try {
      const abi = template.id === 'erc20' ? erc20Abi : [];
      if (!abi) throw new Error('ABI definition is missing.');
      
      await navigator.clipboard.writeText(JSON.stringify(abi, null, 2));
      toast({
        title: 'ABI Copied!',
        description: `The ABI for ${contractName} is on your clipboard.`,
      });
    } catch (error) {
       console.error('Failed to copy ABI:', error);
       toast({
         variant: 'destructive',
         title: 'Copy Failed',
         description: 'Could not copy ABI to clipboard.',
       });
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const from = (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (!deployments.length && !loading) {
      return (
        <CardContent className="p-8 text-center text-muted-foreground">
          No deployments yet.
        </CardContent>
      );
    }

    return (
        <>
            <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Deployer</TableHead>
                    <TableHead>Actions</TableHead>
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dep.address, 'Address')}>
                                <Copy className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copy Address</p></TooltipContent>
                        </Tooltip>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">{`${dep.deployer.slice(0, 10)}...${dep.deployer.slice(-8)}`}</span>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dep.deployer, 'Deployer')}>
                                <Copy className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copy Deployer Address</p></TooltipContent>
                        </Tooltip>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                        {explorerUrl && dep.transactionHash && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`${explorerUrl}/tx/${dep.transactionHash}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View on Explorer</p></TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyAbi(dep.contractName)}>
                                <FileJson className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copy Contract ABI</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/dashboard/contract/${dep.address}`}>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Interact with Contract</p></TooltipContent>
                        </Tooltip>
                        </div>
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
                    <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold">{dep.contractName}</p>
                        <div className="flex items-center -mt-2 -mr-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/contract/${dep.address}`}>
                                <ChevronsRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-mono break-all">{dep.address}</p>
                        <p className="font-mono break-all mt-1">{dep.deployer}</p>
                    </div>
                     <div className="flex items-center gap-1 pt-2">
                        {explorerUrl && dep.transactionHash && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={`${explorerUrl}/tx/${dep.transactionHash}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-3 w-3" /> Explorer
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleCopyAbi(dep.contractName)}>
                            <FileJson className="mr-2 h-3 w-3" /> Copy ABI
                        </Button>
                     </div>
                    <p className="text-xs text-muted-foreground pt-2">
                        {formatDistanceToNow(new Date(dep.timestamp), { addSuffix: true })}
                    </p>
                    </CardContent>
                </Card>
                ))}
            </div>
            </div>
        </>
    );
  };
  
  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
        {totalPages > 1 && (
             <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing <strong>{from}</strong>-<strong>{to}</strong> of <strong>{totalCount}</strong> deployments.
                </div>
                <Pagination>
                    <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                        />
                    </PaginationItem>
                     {/* Simplified pagination links for brevity */}
                     <PaginationItem>
                       <PaginationLink 
                         href="#" 
                         isActive
                         onClick={(e) => e.preventDefault()}
                       >
                         {currentPage}
                       </PaginationLink>
                     </PaginationItem>
                     {currentPage < totalPages && (
                        <PaginationItem>
                           <PaginationLink 
                                href="#"
                                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                           >
                               {currentPage + 1}
                           </PaginationLink>
                        </PaginationItem>
                     )}
                     {totalPages > currentPage + 2 && (
                         <PaginationItem>
                            <PaginationEllipsis />
                         </PaginationItem>
                     )}
                     {totalPages > currentPage + 1 && (
                        <PaginationItem>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink>
                        </PaginationItem>
                     )}
                    <PaginationItem>
                        <PaginationNext 
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                        />
                    </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
