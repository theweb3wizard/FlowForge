'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { createDeployment } from '@/lib/supabase/deployments';
import { detectNetwork } from '@/lib/web3/network';
import { ContractTemplate } from '@/types/template';
import { NetworkType } from '@/types/deployment';
import { deployContract as serviceDeployContract, ProcessedArgs } from '@/lib/web3/transactions';
import { processConstructorArguments } from '@/lib/abi/parser';

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export type DeploymentStatus =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'saving'
  | 'success'
  | 'error';

export function useDeployContract() {
  const { address, provider } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | undefined>();

  const deployContract = async (
    template: ContractTemplate,
    constructorArgs: any[],
    contractName: string
  ): Promise<DeploymentResult> => {
    if (!address || !provider) {
      return { success: false, error: 'Please connect your wallet first' };
    }
  
    setIsDeploying(true);
    setDeploymentStatus('preparing');
    setProgress(10);
  
    let processedArgs: ProcessedArgs;
    let localTransactionHash: string | undefined;

    try {
      // STEP 1: Detect and validate network
      setProgress(15);
      const networkResult = await detectNetwork(provider);
      
      if (!networkResult.isCorrectNetwork || !networkResult.config) {
        throw new Error(networkResult.error || 'Could not detect network. Please connect your wallet.');
      }
  
      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;
      
      // STEP 2: Process constructor arguments
      setProgress(30);
      processedArgs = processConstructorArguments(template, constructorArgs);
  
      // STEP 3: Deploy via the service
      const signer = await provider.getSigner();

      const deployResult = await serviceDeployContract(
        signer,
        template.abi,
        template.bytecode,
        processedArgs.args,
        network,
        (status, hash) => {
          setDeploymentStatus(status);
          if (hash) {
            localTransactionHash = hash;
            setTransactionHash(hash);
          }
          // Update progress based on status
          const progressMap: Record<DeploymentStatus, number> = {
            idle: 0,
            preparing: 20,
            signing: 40,
            submitted: 50,
            confirming: 65,
            confirmed: 80,
            saving: 90,
            success: 100,
            error: 0,
          };
          setProgress(progressMap[status] || progress);
        }
      );

      localTransactionHash = deployResult.transactionHash;
  
      // STEP 4: Save to database
      setDeploymentStatus('saving');
      setProgress(90);
  
      await createDeployment({
        template_id: template.id,
        contract_name: contractName,
        contract_address: deployResult.contractAddress,
        deployer_address: address,
        network: network,
        chain_id: chainId,
        transaction_hash: deployResult.transactionHash,
        constructor_args: processedArgs.argsToSave,
        deployment_status: 'success',
      });
  
      // STEP 5: Success
      setDeploymentStatus('success');
      setProgress(100);
      console.log(`🎉 Deployment complete!`);
  
      return {
        success: true,
        contractAddress: deployResult.contractAddress,
        transactionHash: deployResult.transactionHash,
      };
  
    } catch (error: any) {
      console.error('❌ Deployment error in hook:', error);
      setDeploymentStatus('error');
      setProgress(0);
  
      return {
        success: false,
        error: error.message || 'An unknown error occurred during deployment.',
        transactionHash: localTransactionHash,
      };
  
    } finally {
      setIsDeploying(false);
    }
  };

  const resetDeployment = () => {
    setIsDeploying(false);
    setDeploymentStatus('idle');
    setProgress(0);
    setTransactionHash(undefined);
  };

  return {
    deployContract,
    isDeploying,
    deploymentStatus,
    progress,
    transactionHash,
    resetDeployment,
  };
}
