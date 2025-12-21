'use client';

import Link from 'next/link';
import { DeploymentWithTemplate } from '@/types/deployment';
import { formatNetworkName, getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/web3/network';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';

interface DeploymentCardProps {
  deployment: DeploymentWithTemplate;
  showInteractButton?: boolean;
}

export function DeploymentCard({ deployment, showInteractButton = false }: DeploymentCardProps) {
  const template = deployment.template;
  const deployedDate = new Date(deployment.deployed_at).toLocaleString();
  const Icon = template ? LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.FileCode : LucideIcons.FileCode;


  return (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-secondary p-3 rounded-lg">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <CardTitle className="text-xl font-headline">{deployment.contract_name}</CardTitle>
                     <Badge variant="outline">{formatNetworkName(deployment.network)}</Badge>
                </div>
                <CardDescription>
                  {template?.name || 'Unknown Template'}
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
             {/* Contract Address */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Contract Address</p>
            <a
              href={getExplorerAddressUrl(deployment.network, deployment.contract_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-primary hover:underline break-all"
            >
              {deployment.contract_address}
            </a>
          </div>

          {/* Deployer Address */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Deployed By</p>
            <a
              href={getExplorerAddressUrl(deployment.network, deployment.deployer_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm hover:text-primary break-all"
            >
              {deployment.deployer_address}
            </a>
          </div>

           {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>Deployed on {deployedDate}</span>
            {deployment.transaction_hash && (
              <a
                href={getExplorerTxUrl(deployment.network, deployment.transaction_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                View Transaction
              </a>
            )}
          </div>
            
             {/* Actions */}
            {showInteractButton && (
                <div className="pt-4">
                    <Link href={`/dashboard/contract/${deployment.contract_address}`}>
                    <Button size="sm" variant="outline">
                        Interact with Contract
                    </Button>
                    </Link>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
