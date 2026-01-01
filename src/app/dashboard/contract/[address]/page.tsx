'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDeployment } from '@/hooks/use-queries';
import { formatNetworkName, getExplorerAddressUrl, getExplorerTxUrl } from '@/lib/web3/network';
import { ReadFunctions } from '@/components/interaction/ReadFunctions';
import { WriteFunctions } from '@/components/interaction/WriteFunctions';
import { Button } from '@/components/ui/button';
import { ContractDetailSkeleton } from '@/components/common/LoadingSkeleton';
import { CopyButton } from '@/components/common/CopyButton';

export default function ContractInteractionPage() {
  const params = useParams();
  const address = params.address as string;

  const { data: deployment, isLoading } = useDeployment(address);
  const [activeTab, setActiveTab] = useState<'read' | 'write'>('read');

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <ContractDetailSkeleton />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-4">
            This contract address is not in our database
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const template = deployment.template;
  const abi = template?.abi || deployment.abi || [];

  return (
    <div className="container mx-auto p-8">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-block mb-6">
        <Button variant="outline" size="sm">
          ← Back to Dashboard
        </Button>
      </Link>

      {/* Contract Header */}
      <div className="bg-background border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">{template?.icon || '📄'}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{deployment.contract_name}</h1>
            <p className="text-muted-foreground">{template?.name || 'Smart Contract'}</p>
          </div>
          <div className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
            {formatNetworkName(deployment.network)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Contract Address</p>
            <div className="flex items-center">
              <a
                href={getExplorerAddressUrl(deployment.network, deployment.contract_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline break-all"
              >
                {deployment.contract_address}
              </a>
              <CopyButton text={deployment.contract_address} />
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Deployed By</p>
             <div className="flex items-center">
                <a
                href={getExplorerAddressUrl(deployment.network, deployment.deployer_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-foreground hover:text-primary break-all"
                >
                {deployment.deployer_address}
                </a>
                <CopyButton text={deployment.deployer_address} />
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Deployment Time</p>
            <p className="text-foreground">
              {new Date(deployment.deployed_at).toLocaleString()}
            </p>
          </div>

          {deployment.transaction_hash && (
            <div>
              <p className="text-muted-foreground mb-1">Transaction Hash</p>
              <div className="flex items-center">
                <a
                    href={getExplorerTxUrl(deployment.network, deployment.transaction_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline break-all"
                >
                    {deployment.transaction_hash.slice(0, 10)}...
                    {deployment.transaction_hash.slice(-8)}
                </a>
                <CopyButton text={deployment.transaction_hash} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interaction Tabs */}
      <div className="bg-background border rounded-lg">
        {/* Tab Headers */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('read')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'read'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📖 Read Functions
            </button>
            <button
              onClick={() => setActiveTab('write')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'write'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ✍️ Write Functions
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'read' ? (
            <ReadFunctions contractAddress={deployment.contract_address} abi={abi} />
          ) : (
            <WriteFunctions
              contractAddress={deployment.contract_address}
              abi={abi}
              deployerAddress={deployment.deployer_address}
            />
          )}
        </div>
      </div>
    </div>
  );
}