'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { createDeployment } from '@/lib/supabase/deployments';
import { detectNetwork } from '@/lib/web3/network';
import { NetworkType } from '@/types/deployment';
import { getWeb3ErrorMessage } from '@/lib/errors';
import { ContractTemplate } from '@/types/template';

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

/**
 * Safely converts a value to BigNumber, handling whitespace and validation
 */
function toBigNumberSafe(value: unknown): ethers.BigNumber {
  if (ethers.BigNumber.isBigNumber(value)) {
    return value;
  }

  let stringValue: string;

  if (typeof value === 'string') {
    stringValue = value.trim();
  } else if (typeof value === 'number') {
    stringValue = value.toString();
  } else {
    stringValue = String(value).trim();
  }

  // Validate the string is a valid integer (positive, negative, or zero)
  if (!/^-?\d+$/.test(stringValue)) {
    throw new Error(
      `Invalid integer value for BigNumber: "${stringValue}". Expected a valid integer string.`
    );
  }

  return ethers.BigNumber.from(stringValue);
}

export function useBatchDeploy() {
  const { address, provider } = useWallet();
  const [isBatchDeploying, setIsBatchDeploying] = useState(false);
  const [currentDeployingIndex, setCurrentDeployingIndex] = useState<number>(-1);
  const [batchResults, setBatchResults] = useState<SingleDeploymentResult[]>([]);

  /**
   * Deploy a single contract (reuses logic from useDeployContract)
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

    let contract: ethers.Contract | undefined;
    let localTransactionHash: string | undefined;

    const confirmationConfig = {
      localnet: { confirmations: 1, timeout: 30000 },
      testnet: { confirmations: 1, timeout: 180000 },
      mainnet: { confirmations: 2, timeout: 300000 },
    };

    try {
      // Detect network
      const networkResult = await detectNetwork(provider);
      if (!networkResult.isCorrectNetwork) {
        throw new Error(networkResult.error || 'Please connect to a supported network.');
      }

      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;
      const config = confirmationConfig[network] || confirmationConfig.testnet;

      // Prepare contract factory
      const signer = await provider.getSigner();
      const bytecodeWithPrefix = template.bytecode.startsWith('0x')
        ? template.bytecode
        : `0x${template.bytecode}`;

      const factory = new ethers.ContractFactory(
        template.abi,
        bytecodeWithPrefix,
        signer
      );

      // Process constructor arguments
      const templateParams = Array.isArray(template.parameters) ? template.parameters : [];
      const processedArgs = constructorArgs.map((arg, index) => {
        const param = templateParams[index];
        if (!param) return arg;
        const paramType = param.type;

        if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
          return toBigNumberSafe(arg);
        }
        if (paramType === 'bool') {
          const trimmedArg = typeof arg === 'string' ? arg.trim() : arg;
          return trimmedArg === 'true' || trimmedArg === true;
        }
        if (paramType?.includes('[]')) {
          let arrayValue: any[];
          
          // Parse array if it's a string
          if (typeof arg === 'string') {
            try {
              arrayValue = JSON.parse(arg);
            } catch {
              arrayValue = arg.split(',').map((item: string) => item.trim());
            }
          } else {
            arrayValue = Array.isArray(arg) ? arg : [arg];
          }

          // If it's an array of integers, convert each element safely
          if (paramType.match(/u?int\d*\[\]/)) {
            return arrayValue.map((item) => toBigNumberSafe(item));
          }

          return arrayValue;
        }
        
        // For string types, trim whitespace
        if (typeof arg === 'string') {
          return arg.trim();
        }
        
        return arg;
      });

      const overrides = { gasLimit: 3000000 };

      // Skip gas estimation for testnet/mainnet (as per your working code)
      if (network === 'localnet') {
        try {
          const deployTx = factory.getDeployTransaction(...processedArgs, overrides);
          await signer.estimateGas(deployTx);
        } catch (estimateError: any) {
          if (estimateError.message?.includes('StackOverflow')) {
            throw new Error('Stack overflow detected in constructor');
          } else if (estimateError.message?.includes('revert')) {
            throw new Error('Constructor reverted during simulation');
          }
          throw estimateError;
        }
      }

      // Deploy contract
      console.log(`🚀 [Batch] Deploying: ${contractName}...`);
      contract = await factory.deploy(...processedArgs, overrides);

      const deploymentTx = contract.deployTransaction || (contract as any).deploymentTransaction;
      if (!deploymentTx || !deploymentTx.hash) {
        throw new Error('Failed to get transaction hash from deployment');
      }

      localTransactionHash = deploymentTx.hash;
      console.log(`✅ [Batch] Transaction submitted: ${localTransactionHash}`);

      // Wait for confirmation
      const receipt = await provider.waitForTransaction(
        localTransactionHash,
        config.confirmations,
        config.timeout
      );

      if (receipt.status === 0) {
        throw new Error('Transaction reverted on-chain');
      }

      // Verify contract deployed
      const deployedCode = await provider.getCode(contract.address);
      if (deployedCode === '0x' || deployedCode === '0x0') {
        throw new Error('No bytecode at contract address');
      }

      console.log(`✅ [Batch] Contract deployed at: ${contract.address}`);

      // Save to database
      const constructorArgsToSave = Object.fromEntries(
        templateParams.map((param, i) => [param.name, constructorArgs[i] || ''])
      );

      await createDeployment({
        template_id: template.id,
        contract_name: contractName,
        contract_address: contract.address,
        deployer_address: address,
        network: network,
        chain_id: chainId,
        transaction_hash: localTransactionHash,
        constructor_args: constructorArgsToSave,
        deployment_status: 'success',
      });

      return {
        itemId: item.id,
        success: true,
        contractAddress: contract.address,
        transactionHash: localTransactionHash,
      };
    } catch (error: any) {
      console.error(`❌ [Batch] Deployment failed for ${contractName}:`, error);

      let errorMessage = error.message || 'Unknown deployment error';

      if (errorMessage.includes('StackOverflow')) {
        errorMessage = 'Stack overflow error in constructor';
      } else if (errorMessage.includes('user rejected') || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else {
        errorMessage = getWeb3ErrorMessage(error);
      }

      return {
        itemId: item.id,
        success: false,
        error: errorMessage,
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

      // Notify progress callback
      onProgress(item.id, result);

      // Small delay between deployments to avoid overwhelming the network
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