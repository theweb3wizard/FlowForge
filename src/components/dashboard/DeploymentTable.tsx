"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DeploymentWithTemplate } from '@/types/deployment';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { getExplorerAddressUrl } from '@/lib/web3/network';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function DeploymentTable() {
  const [deployments, setDeployments] = useState<DeploymentWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${name} address copied!`,
    });
  };

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('deployments')
          .select('*, template:contract_templates(name, icon)')
          .eq('deployment_status', 'success')
          .order('deployed_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setDeployments(data as any);
      } catch (error: any) {
        console.error("Error fetching deployments:", error);
        toast({
          variant: 'destructive',
          title: 'Error fetching deployments',
          description: 'Could not load recent deployment data.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('deployments-table-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deployments' },
        (payload) => {
            if (payload.new.deployment_status === 'success') {
                // Manually join template data as it's not available in the payload
                const newDeployment = payload.new as DeploymentWithTemplate;
                // This is a simplification; ideally, we'd fetch the template info
                // but for now, we'll add it and show 'Unknown'
                setDeployments(prev => [newDeployment, ...prev]);
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (loading) {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Deployed By</TableHead>
            <TableHead>Network</TableHead>
            <TableHead className="text-right">Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                 <Link href={`/dashboard/contract/${d.contract_address}`}>
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <span className="text-2xl">{d.template?.icon || '📜'}</span>
                        <div>
                            <div className="font-medium group-hover:text-primary">{d.contract_name}</div>
                            <div className="text-xs text-muted-foreground">{d.template?.name || 'Unknown'}</div>
                        </div>
                    </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span>{`${d.contract_address.slice(0, 6)}...${d.contract_address.slice(-4)}`}</span>
                  <Copy 
                    className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(d.contract_address, 'Contract')} 
                  />
                  <a href={getExplorerAddressUrl(d.network, d.contract_address)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                 <div className="flex items-center gap-2 font-mono text-sm">
                  <span>{`${d.deployer_address.slice(0, 6)}...${d.deployer_address.slice(-4)}`}</span>
                   <a href={getExplorerAddressUrl(d.network, d.deployer_address)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{d.network}</Badge>
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(d.deployed_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
