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
  
    let contract: ethers.Contract | undefined;
    let localTransactionHash: string | undefined;
    let pollInterval: NodeJS.Timeout | undefined;
  
    const confirmationConfig = {
      localnet: { confirmations: 1, timeout: 30000 },
      testnet: { confirmations: 1, timeout: 180000 },
      mainnet: { confirmations: 2, timeout: 300000 }
    };
  
    try {
      // STEP 1: Detect and validate network
      setProgress(15);
      const networkResult = await detectNetwork(provider);
      
      if (!networkResult.isCorrectNetwork) {
        throw new Error(networkResult.error || 'Please connect to a supported network.');
      }
  
      const network = networkResult.config.type as NetworkType;
      const chainId = networkResult.config.chainId;
      const config = confirmationConfig[network] || confirmationConfig.testnet;
  
      // STEP 2: Prepare contract factory
      setProgress(20);
      const signer = await provider.getSigner();
      
      const bytecodeWithPrefix = template.bytecode.startsWith('0x')
        ? template.bytecode
        : `0x${template.bytecode}`;
  
      const factory = new ethers.ContractFactory(
        template.abi,
        bytecodeWithPrefix,
        signer
      );
  
      // STEP 3: Process constructor arguments
      setProgress(30);
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
            return arg.split(',').map((item: string) => item.trim());
          }
        }
        return arg;
      });
  
  
     // STEP 4: Sign transaction
setDeploymentStatus('signing');
setProgress(40);

const overrides = { gasLimit: 3000000 };

// 🔥 UPDATED: Make gas estimation optional and network-aware
let skipEstimation = false;

if (network !== 'localnet') {
  console.log('⚠️  Skipping gas estimation for testnet/mainnet (direct deployment)');
  skipEstimation = true;
}

if (!skipEstimation) {
  try {
    console.log('🧪 Estimating gas for deployment...');
    const deployTx = factory.getDeployTransaction(...processedArgs, overrides);
    await signer.estimateGas(deployTx);
    console.log('✅ Gas estimation successful');
  } catch (estimateError: any) {
    console.error('❌ Gas estimation failed:', estimateError);
    
    if (network === 'localnet') {
      let errorMsg = 'Contract deployment simulation failed. ';
      
      if (estimateError.message?.includes('StackOverflow')) {
        errorMsg += 'Stack overflow detected - your contract may have infinite recursion in the constructor.';
      } else if (estimateError.message?.includes('revert')) {
        errorMsg += 'Contract constructor reverted. Check your constructor logic and parameters.';
      } else if (estimateError.message?.includes('out of gas')) {
        errorMsg += 'Transaction requires more gas than provided.';
      } else {
        errorMsg += estimateError.reason || estimateError.message || 'Unknown error during simulation.';
      }
      
      throw new Error(errorMsg);
    } else {
      console.log('⚠️  Gas estimation failed on testnet, proceeding with deployment anyway...');
    }
  }
}

// Send the transaction
console.log('📤 Sending deployment transaction...');
contract = await factory.deploy(...processedArgs, overrides);

// 🔥 CRITICAL FIX: Handle different transaction response formats
// Some networks return deployTransaction, others return deploymentTransaction
const deploymentTx = contract.deployTransaction || (contract as any).deploymentTransaction;

if (!deploymentTx || !deploymentTx.hash) {
  console.error('❌ Deployment transaction object:', deploymentTx);
  throw new Error('Failed to get transaction hash from deployment. The network may not be supported.');
}

localTransactionHash = deploymentTx.hash;
setTransactionHash(localTransactionHash);

// Transaction is SUBMITTED but NOT confirmed
setDeploymentStatus('submitted');
setProgress(50);

console.log(`✅ Transaction submitted: ${localTransactionHash}`);
console.log(`⏳ Waiting for network confirmation...`);

// Start polling transaction status
pollInterval = setInterval(async () => {
  try {
    const tx = await provider.getTransaction(localTransactionHash!);
    
    if (tx && tx.blockNumber) {
      console.log(`⛏️  Transaction mined in block ${tx.blockNumber}`);
    } else if (tx) {
      console.log(`🔄 Transaction pending in mempool...`);
    } else {
      console.log(`⚠️  Transaction not found (may be dropped)`);
    }
  } catch (error) {
    console.error('Polling error:', error);
  }
}, 3000);

// STEP 6: Wait for transaction to be mined
let receipt;
try {
  receipt = await provider.waitForTransaction(
    localTransactionHash, 
    config.confirmations, 
    config.timeout
  );
} catch (timeoutError: any) {
  clearInterval(pollInterval);
  
  // Check if transaction was dropped
  try {
    const tx = await provider.getTransaction(localTransactionHash);
    if (!tx) {
      throw new Error('Transaction was dropped from the network. Try increasing gas price.');
    }
  } catch (e) {
    // Ignore lookup errors
  }
  
  throw new Error('Transaction confirmation timed out. Check block explorer for status.');
}

clearInterval(pollInterval);

// STEP 7: Check transaction status
if (receipt.status === 0) {
  console.error('❌ Transaction reverted on-chain');
  throw new Error('Transaction failed: Contract execution reverted. Check constructor logic and parameters.');
}

setDeploymentStatus('confirming');
setProgress(65);
console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

// STEP 8: Verify contract was actually deployed
const deployedCode = await provider.getCode(contract.address);
if (deployedCode === '0x' || deployedCode === '0x0') {
  console.error('❌ No bytecode found at contract address');
  throw new Error('Contract deployment failed: No bytecode at address. Contract may have self-destructed or deployment reverted.');
}

setDeploymentStatus('confirmed');
setProgress(80);
console.log(`✅ Contract deployed at: ${contract.address}`);
console.log(`✅ Bytecode verified: ${deployedCode.length} bytes`);
  
      // STEP 9: Save to database
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
        transaction_hash: localTransactionHash,
        constructor_args: constructorArgsToSave,
        deployment_status: 'success',
      });
  
      if (!deployment) {
        throw new Error('Failed to save deployment to database');
      }
  
      // STEP 10: Success
      setDeploymentStatus('success');
      setProgress(100);
      console.log(`🎉 Deployment complete!`);
  
      return {
        success: true,
        contractAddress: contract.address,
        transactionHash: localTransactionHash,
      };
  
    } catch (error: any) {
      console.error('❌ Deployment error:', error);
      
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      setDeploymentStatus('error');
      setProgress(0);
  
      // Enhanced error detection
      let errorMessage = error.message || 'Unknown deployment error';
  
      // Don't double-wrap error messages
      if (!errorMessage.includes('Contract deployment') && !errorMessage.includes('Transaction failed')) {
        // Check for specific error types
        if (errorMessage.includes('StackOverflow')) {
          errorMessage = '⚠️ Stack overflow error: Your contract has infinite recursion in the constructor. Please review your contract code.';
        } else if (errorMessage.includes('user rejected') || error.code === 'ACTION_REJECTED') {
          errorMessage = '🚫 Transaction rejected: You cancelled the transaction in your wallet.';
        } else if (errorMessage.includes('insufficient funds') || error.code === 'INSUFFICIENT_FUNDS') {
          errorMessage = '💰 Insufficient funds: Add more ETH to your wallet to cover gas costs.';
        } else if (errorMessage.includes('nonce')) {
          errorMessage = '🔄 Nonce error: Try resetting your wallet account in MetaMask (Settings → Advanced → Reset Account).';
        } else {
          // Use the Web3 error message handler for other cases
          errorMessage = getWeb3ErrorMessage(error);
        }
      }
  
      return {
        success: false,
        error: errorMessage,
        transactionHash: localTransactionHash
      };
  
    } finally {
      setIsDeploying(false);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
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