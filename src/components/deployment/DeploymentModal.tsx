'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContractTemplate } from '@/types/template';
import { useDeployContract } from '@/hooks/useDeployContract';
import { ConstructorForm } from './ConstructorForm';
import { NetworkIndicator } from './NetworkIndicator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getExplorerTxUrl } from '@/lib/web3/network';
import { Confetti } from '../common/Confetti';
import { AlertCircle, CheckCircle, Rocket } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DeploymentModalProps {
  template: ContractTemplate | null;
  onClose: () => void;
}

export function DeploymentModal({ template, onClose }: DeploymentModalProps) {
  const router = useRouter();
  const { deployContract, isDeploying, deploymentStatus, progress, resetDeployment } = useDeployContract();
  
  const [contractName, setContractName] = useState('');
  const [constructorArgs, setConstructorArgs] = useState<any[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [result, setResult] = useState<{ address?: string; txHash?: string; error?: string } | null>(null);

  useEffect(() => {
    if (template) {
        setContractName(template.name);
        // Auto-validate form if there are no parameters
        if (!template.parameters || template.parameters.length === 0) {
            setIsFormValid(true);
        } else {
            setIsFormValid(false);
        }
    }
  }, [template]);

  const handleDeploy = async () => {
    if (!template || !contractName.trim()) return;

    const deployResult = await deployContract(template, constructorArgs, contractName);
    
    if (deployResult.success) {
      setResult({
        address: deployResult.contractAddress,
        txHash: deployResult.transactionHash,
      });
      toast.success('Contract deployed successfully!', {
        description: `Address: ${deployResult.contractAddress?.slice(0, 10)}...`,
      });
    } else {
      setResult({ error: deployResult.error });
      toast.error('Deployment failed', {
        description: deployResult.error,
      });
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      resetDeployment();
      setContractName('');
      setConstructorArgs([]);
      setResult(null);
      onClose();
    }
  };

  const handleViewDashboard = () => {
    handleClose();
    router.push('/dashboard');
  };

  if (!template) return null;

  // Success State
  if (deploymentStatus === 'success' && result?.address) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <Confetti />
          <DialogHeader>
             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Deployment Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your {template.name} contract is live on the blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
              <div>
                <Label htmlFor='contract-address-success' className="text-xs">Contract Address</Label>
                <p id="contract-address-success" className="font-mono text-sm break-all">{result.address}</p>
              </div>
              <div>
                <Label htmlFor='tx-hash-success' className="text-xs">Transaction Hash</Label>
                 <Link
                  id='tx-hash-success'
                  href={getExplorerTxUrl('blockdag-testnet', result.txHash || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary hover:underline break-all block"
                >
                  {result.txHash}
                </Link>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleViewDashboard} className="flex-1">
                View Dashboard
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error State
  if (deploymentStatus === 'error' && result?.error) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Deployment Failed</DialogTitle>
            <DialogDescription className="text-center">
              There was an error deploying your contract.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive-foreground">{result.error}</p>
            </div>

            <div className="flex gap-2">
               <Button onClick={() => { resetDeployment(); setResult(null); }} className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Form State
  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-4xl">{template.icon}</span>
            <div className='flex flex-col'>
                <span className="text-2xl font-headline">Deploy {template.name}</span>
                <DialogDescription className="text-left text-sm text-muted-foreground font-normal mt-1">{template.description}</DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Network Status */}
          <div>
            <h3 className="text-md font-medium mb-2">Network</h3>
            <NetworkIndicator />
          </div>

          {/* Contract Name */}
          <div className="space-y-2">
            <Label htmlFor="contractName">
              Contract Name <span className="text-destructive">*</span>
            </Label>
             <Input
                id="contractName"
                placeholder="e.g., My Awesome Token"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                disabled={isDeploying}
            />
             <p className="text-xs text-muted-foreground">This is a friendly name for your reference on the dashboard.</p>
          </div>

          {/* Constructor Parameters */}
          <div>
            <h3 className="text-md font-medium mb-3">Configuration Parameters</h3>
            <ConstructorForm
              template={template}
              onArgsChange={setConstructorArgs}
              onValidChange={setIsFormValid}
            />
          </div>

          {/* Deployment Progress */}
          {isDeploying && (
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="capitalize">{deploymentStatus}...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || !contractName.trim() || !isFormValid}
              className="flex-1"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {isDeploying ? 'Deploying...' : 'Deploy Contract'}
            </Button>
            <Button onClick={handleClose} variant="ghost" disabled={isDeploying}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
