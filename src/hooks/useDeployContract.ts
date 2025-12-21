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

      // MONKEY-PATCH: Add 0x prefix if missing and replace PUSH0 (0x5f) with PUSH1 00 (0x6000)
      const bytecodeWithPrefix = template.bytecode.startsWith('0x')
        ? template.bytecode
        : `0x${template.bytecode}`;
      const patchedBytecode = bytecodeWithPrefix.replaceAll('5f', '6000');


      const factory = new ethers.ContractFactory(
        template.abi,
        patchedBytecode,
        signer
      );
      

      // STEP 3: Validate constructor arguments
      setProgress(40);
      
      const processedArgs = constructorArgs.map((arg, index) => {
        const param = template.parameters[index];
        if (!param) return arg;
        const paramType = param.type;
        
        if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
           return ethers.BigNumber.from(arg);
        }
        if (paramType === 'bool') {
          return arg === 'true' || arg === true;
        }
        if (paramType?.includes('[]')) {
          try {
            return JSON.parse(arg);
          } catch {
            // Handle cases where array might not be valid JSON
             return arg.split(',').map(item => item.trim());
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
          (template.parameters || []).map((param, i) => [param.name, constructorArgs[i]])
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

      let errorMessage = 'An unknown error occurred during deployment.';
      
      if (typeof error === 'object' && error !== null) {
        // Handle ethers-specific error structures
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            errorMessage = 'Transaction rejected by user.';
        } else if (error.reason) {
            errorMessage = error.reason;
        } else if (error.data?.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else {
           // Fallback for unexpected error shapes
           try {
             errorMessage = JSON.stringify(error);
           } catch {
             errorMessage = 'An un-serializable error occurred.'
           }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }


      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDeploying(false);
    }
  };

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
