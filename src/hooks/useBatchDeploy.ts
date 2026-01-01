'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { createDeployment } from '@/lib/supabase/deployments';
import { detectNetwork } from '@/lib/web3/network';
import { NetworkType } from '@/types/deployment';
import { ContractTemplate } from '@/types/template';
import { deployContract as serviceDeployContract, ProcessedArgs } from '@/lib/web3/transactions';
import { processConstructorArguments } from '@/lib/abi/parser';

interface BatchDeploymentItem {
  id: string;
  template: ContractTemplate;
  contractName: string;
  constructorArgs: any[];
}

interface SingleDeploymentResult {
  itemId: string;
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export function useBatchDeploy() {
  const { address, provider } = useWallet();
  const [isBatchDeploying, setIsBatchDeploying] = useState(false);
  const [currentDeployingIndex, setCurrentDeployingIndex] = useState<number>(-1);
  const [batchResults, setBatchResults] = useState<SingleDeploymentResult[]>([]);

  /**
   * Deploy a single contract using the transaction service
   */
  const deploySingleContract = async (
    item: BatchDeploymentItem
  ): Promise<SingleDeploymentResult> => {
    if (!address || !provider) {
      return {
        itemId: item.id,
        success: false,
        error: 'Wallet not connected',
      };
    }

    const { template, constructorArgs, contractName } = item;
    let localTransactionHash: string | undefined;

    try {
      const networkResult = await detectNetwork(provider);
      if (!networkResult.isCorrectNetwork || !networkResult.config) {
        throw new Error(networkResult.error || 'Please connect to a supported network.');
      }

      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;
      const signer = await provider.getSigner();

      // Process constructor arguments
      const processedArgs: ProcessedArgs = processConstructorArguments(template, constructorArgs);
      
      console.log(`🚀 [Batch] Deploying: ${contractName}...`);

      const deployResult = await serviceDeployContract(
        signer,
        template.abi,
        template.bytecode,
        processedArgs.args,
        network,
        (status, hash) => {
          console.log(`[Batch] ${contractName} status: ${status}`, hash ? `| Hash: ${hash}`: '');
          if (hash) localTransactionHash = hash;
        }
      );

      localTransactionHash = deployResult.transactionHash;
      console.log(`✅ [Batch] Contract deployed at: ${deployResult.contractAddress}`);

      await createDeployment({
        template_id: template.id,
        contract_name: contractName,
        contract_address: deployResult.contractAddress,
        deployer_address: address,
        network: network,
        chain_id: chainId,
        transaction_hash: localTransactionHash,
        constructor_args: processedArgs.argsToSave,
        deployment_status: 'success',
      });

      return {
        itemId: item.id,
        success: true,
        contractAddress: deployResult.contractAddress,
        transactionHash: localTransactionHash,
      };
    } catch (error: any) {
      console.error(`❌ [Batch] Deployment failed for ${contractName}:`, error);
      return {
        itemId: item.id,
        success: false,
        error: error.message,
        transactionHash: localTransactionHash,
      };
    }
  };

  /**
   * Deploy all contracts in batch sequentially
   */
  const deployBatch = async (
    items: BatchDeploymentItem[],
    onProgress: (itemId: string, result: SingleDeploymentResult) => void
  ): Promise<void> => {
    setIsBatchDeploying(true);
    setBatchResults([]);
    setCurrentDeployingIndex(0);

    const results: SingleDeploymentResult[] = [];

    for (let i = 0; i < items.length; i++) {
      setCurrentDeployingIndex(i);
      const item = items[i];

      console.log(`\n📦 [Batch] Deploying ${i + 1}/${items.length}: ${item.contractName}`);

      const result = await deploySingleContract(item);
      results.push(result);

      onProgress(item.id, result);

      if (!result.success) {
        // Stop batch on first error
        console.error(`\n🛑 [Batch] Halting deployment due to error on step ${i+1}.`);
        break; 
      }
      
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setBatchResults(results);
    setCurrentDeployingIndex(-1);
    setIsBatchDeploying(false);

    console.log(`\n🎉 [Batch] Deployment complete!`);
    console.log(`✅ Successful: ${results.filter((r) => r.success).length}`);
    console.log(`❌ Failed: ${results.filter((r) => !r.success).length}`);
  };

  return {
    deployBatch,
    isBatchDeploying,
    currentDeployingIndex,
    batchResults,
  };
}
