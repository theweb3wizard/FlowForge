'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { createDeployment } from '@/lib/supabase/deployments';
import { detectNetwork } from '@/lib/web3/network';
import { ContractTemplate } from '@/types/template';
import { NetworkType } from '@/types/deployment';
import { getWeb3ErrorMessage } from '@/lib/errors';

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

type DeploymentStatus = 
  | 'idle' 
  | 'preparing' 
  | 'signing' 
  | 'deploying' 
  | 'confirming' 
  | 'saving' 
  | 'success' 
  | 'error';


export function useDeployContract() {
  const { address, provider } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
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

    let contract: ethers.Contract | undefined;
    let transactionHash: string | undefined;

    try {
      // STEP 1: Detect and validate network
      setDeploymentStatus('preparing');
      setProgress(20);

      const networkResult = await detectNetwork(provider);
      
      if (!networkResult.isCorrectNetwork) {
        throw new Error(networkResult.error || 'Please connect to a supported network.');
      }

      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;

      // STEP 2: Prepare contract factory
      setProgress(30);

      const signer = await provider.getSigner();
      
      const bytecodeWithPrefix = template.bytecode.startsWith('0x')
        ? template.bytecode
        : `0x${template.bytecode}`;

      const factory = new ethers.ContractFactory(
        template.abi,
        bytecodeWithPrefix,
        signer
      );

      // STEP 3: Validate constructor arguments
      setProgress(40);
      
      const templateParams = Array.isArray(template.parameters) ? template.parameters : [];
      const processedArgs = constructorArgs.map((arg, index) => {
        const param = templateParams[index];
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
             return arg.split(',').map(item => item.trim());
          }
        }
        return arg;
      });

      // STEP 4: Deploy contract
      setDeploymentStatus('signing');
      setProgress(50);
      
      const overrides = {
        gasLimit: 3000000, 
      };

      contract = await factory.deploy(...processedArgs, overrides);
      transactionHash = contract.deployTransaction.hash;
      
      setDeploymentStatus('confirming');
      setProgress(60);

      // Robustly wait for confirmation with a timeout
      const receipt = await provider.waitForTransaction(transactionHash, 1, 120000); // 1 confirmation, 2 min timeout

      if (receipt.status === 0) {
        throw new Error('Transaction was reverted by the network.');
      }
      
      setProgress(80);

      // STEP 5: Save to Supabase
      setDeploymentStatus('saving');
      setProgress(90);

      const constructorArgsToSave = Object.fromEntries(
        templateParams.map((param, i) => [param.name, constructorArgs[i] || ''])
      );

      const deployment = await createDeployment({
        template_id: template.id,
        contract_name: contractName,
        contract_address: contract.address,
        deployer_address: address,
        network: network,
        chain_id: chainId,
        transaction_hash: contract.deployTransaction.hash,
        constructor_args: constructorArgsToSave,
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

      return {
        success: false,
        error: getWeb3ErrorMessage(error),
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
