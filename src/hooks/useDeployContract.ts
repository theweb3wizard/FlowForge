'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { createDeployment } from '@/lib/supabase/deployments';
import { detectNetwork } from '@/lib/web3/network';
import { ContractTemplate } from '@/types/template';
import { NetworkType } from '@/types/deployment';

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export function useDeployContract() {
  const { address, provider } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'preparing' | 'signing' | 'deploying' | 'saving' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  /**
   * Deploy a smart contract from a template
   */
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

    try {
      // STEP 1: Detect and validate network
      setDeploymentStatus('preparing');
      setProgress(20);

      const networkResult = await detectNetwork(provider);
      
      if (!networkResult.isCorrectNetwork) {
        throw new Error(networkResult.error || 'Please connect to BlockDAG Testnet');
      }

      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;

      // STEP 2: Prepare contract factory
      setProgress(30);

      const signer = await provider.getSigner();
      const factory = new ethers.ContractFactory(
        template.abi,
        template.bytecode,
        signer
      );

      // STEP 3: Validate constructor arguments
      setProgress(40);
      
      // Convert arguments to proper types
      const processedArgs = constructorArgs.map((arg, index) => {
        const paramType = template.parameters[index]?.type;
        
        // Handle different types
        if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
          return ethers.BigNumber.from(arg);
        }
        if (paramType === 'bool') {
          return arg === 'true' || arg === true;
        }
        if (paramType?.includes('[]')) {
          // Parse array input
          try {
            return JSON.parse(arg);
          } catch {
            return arg;
          }
        }
        return arg;
      });

      // STEP 4: Deploy contract
      setDeploymentStatus('signing');
      setProgress(50);

      const contract = await factory.deploy(...processedArgs);
      
      setDeploymentStatus('deploying');
      setProgress(60);

      // Wait for deployment transaction to be mined
      await contract.deployTransaction.wait(1);

      setProgress(80);

      // STEP 5: Save to Supabase
      setDeploymentStatus('saving');
      setProgress(90);

      const deployment = await createDeployment({
        template_id: template.id,
        contract_name: contractName,
        contract_address: contract.address,
        deployer_address: address,
        network: network,
        chain_id: chainId,
        transaction_hash: contract.deployTransaction.hash,
        constructor_args: Object.fromEntries(
          template.parameters.map((param, i) => [param.name, constructorArgs[i]])
        ),
        deployment_status: 'success',
      });

      if (!deployment) {
        throw new Error('Failed to save deployment to database');
      }

      // STEP 6: Success
      setDeploymentStatus('success');
      setProgress(100);

      return {
        success: true,
        contractAddress: contract.address,
        transactionHash: contract.deployTransaction.hash,
      };

    } catch (error: any) {
      console.error('Deployment error:', error);
      
      setDeploymentStatus('error');
      setProgress(0);

      // Parse error messages
      let errorMessage = 'Deployment failed';
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDeploying(false);
    }
  };

  /**
   * Reset deployment state
   */
  const resetDeployment = () => {
    setIsDeploying(false);
    setDeploymentStatus('idle');
    setProgress(0);
  };

  return {
    deployContract,
    isDeploying,
    deploymentStatus,
    progress,
    resetDeployment,
  };
}
