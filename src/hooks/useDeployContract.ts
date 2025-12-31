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

  /**
   * Enhanced argument processor for all contract types
   */
  const processConstructorArguments = (
    template: ContractTemplate,
    constructorArgs: any[]
  ): any[] => {
    const templateParams = Array.isArray(template.parameters) ? template.parameters : [];

    console.group('🔧 Processing Constructor Arguments');
    console.log('Contract:', template.name);
    console.log('Raw inputs:', constructorArgs);

    const processedArgs = constructorArgs.map((arg, index) => {
      const param = templateParams[index];
      if (!param) {
        console.warn(`⚠️  No parameter definition for index ${index}`);
        return arg;
      }

      const paramType = param.type;
      const paramName = param.name?.toLowerCase() || '';

      console.log(`\n Processing param ${index}: ${param.name} (${paramType})`);
      console.log(`  Raw value:`, arg);

      // ========================================
      // 1. EMPTY VALUE CHECK
      // ========================================
      if (arg === '' || arg === null || arg === undefined) {
        console.error(`  ❌ Missing value for required parameter: ${param.name}`);
        throw new Error(`Missing value for parameter: ${param.name} (${paramType})`);
      }

      // ========================================
      // 2. ADDRESS TYPE
      // ========================================
      if (paramType === 'address') {
        const addressValue = arg.toString().trim();
        
        // Validate address format
        if (!ethers.utils.isAddress(addressValue)) {
          console.error(`  ❌ Invalid address format: ${addressValue}`);
          throw new Error(`Invalid address for ${param.name}. Expected format: 0x...`);
        }

        // Normalize to checksum address
        const checksumAddress = ethers.utils.getAddress(addressValue);
        console.log(`  ✅ Valid address:`, checksumAddress);
        return checksumAddress;
      }

      // ========================================
      // 3. ADDRESS ARRAY
      // ========================================
      if (paramType === 'address[]') {
        try {
          // Parse if string
          let addresses = typeof arg === 'string' ? JSON.parse(arg) : arg;

          // Handle comma-separated string
          if (typeof addresses === 'string') {
            addresses = addresses.split(',').map((a: string) => a.trim());
          }

          if (!Array.isArray(addresses)) {
            throw new Error('Expected an array of addresses');
          }

          // Validate each address
          const validatedAddresses = addresses.map((addr: string, i: number) => {
            const trimmedAddr = addr.toString().trim();
            if (!ethers.utils.isAddress(trimmedAddr)) {
              throw new Error(`Invalid address at position ${i}: ${trimmedAddr}`);
            }
            return ethers.utils.getAddress(trimmedAddr);
          });

          console.log(`  ✅ Valid address array (${validatedAddresses.length} addresses)`);
          return validatedAddresses;
        } catch (error: any) {
          console.error(`  ❌ Address array parsing failed:`, error.message);
          throw new Error(`Invalid address array for ${param.name}. Use format: ["0x123...", "0x456..."]`);
        }
      }

      // ========================================
      // 4. UINT/INT TYPES (SMART HANDLING)
      // ========================================
      if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
        try {
          let value = arg.toString().trim();

          // Special handling for specific parameter names
          // -----------------------------------------
          
          // A) WEI AMOUNTS (goal, amount, price, supply, value, balance, limit)
          if (
            paramName.includes('goal') ||
            paramName.includes('amount') ||
            paramName.includes('price') ||
            paramName.includes('supply') ||
            paramName.includes('value') ||
            paramName.includes('balance') ||
            paramName.includes('limit')
          ) {
            // If the number is reasonable (< 1 billion), assume it's in ETH
            const numValue = parseFloat(value);
            
            if (numValue < 1_000_000_000) {
              console.log(`  🔄 Converting ${numValue} ETH to Wei`);
              const weiValue = ethers.utils.parseEther(value);
              console.log(`  ✅ Wei value:`, weiValue.toString());
              return weiValue;
            } else {
              // Already in Wei
              console.log(`  ✅ Large number (assuming Wei):`, value);
              return ethers.BigNumber.from(value);
            }
          }

          // B) TIMESTAMPS (time, start, end, deadline, timestamp)
          if (
            paramName.includes('time') ||
            paramName.includes('start') ||
            paramName.includes('end') ||
            paramName.includes('deadline') ||
            paramName.includes('timestamp')
          ) {
            // Check if it's already a Unix timestamp (10 digits)
            if (/^\d{10}$/.test(value)) {
              console.log(`  ✅ Unix timestamp:`, value);
              return ethers.BigNumber.from(value);
            }

            // Try parsing as date
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                const unixTimestamp = Math.floor(date.getTime() / 1000);
                console.log(`  🔄 Converted date to timestamp:`, unixTimestamp);
                return ethers.BigNumber.from(unixTimestamp);
              }
            } catch (e) {
              // Not a valid date, treat as regular number
            }

            // If still a small number, might be relative time (e.g., duration in seconds)
            console.log(`  ✅ Numeric value:`, value);
            return ethers.BigNumber.from(value);
          }

          // C) DURATION (duration, period, interval - usually in seconds)
          if (
            paramName.includes('duration') ||
            paramName.includes('period') ||
            paramName.includes('interval')
          ) {
            const numValue = parseFloat(value);
            
            // If it's a reasonable number (< 100 years in seconds), use as-is
            if (numValue < 3_153_600_000) {
              console.log(`  ✅ Duration in seconds:`, value);
              return ethers.BigNumber.from(value);
            }
          }

          // D) PERCENTAGES (rate, percent, fee, basis - might need conversion)
          if (
            paramName.includes('rate') ||
            paramName.includes('percent') ||
            paramName.includes('fee') ||
            paramName.includes('basis')
          ) {
            // Most contracts expect basis points (e.g., 100 = 1%)
            // If user enters 5 (meaning 5%), we keep it as 5
            // The contract should handle the conversion
            console.log(`  ✅ Rate/Fee value:`, value);
            return ethers.BigNumber.from(value);
          }

          // E) THRESHOLD/QUORUM (required signatures, votes, etc.)
          if (
            paramName.includes('threshold') ||
            paramName.includes('quorum') ||
            paramName.includes('required')
          ) {
            console.log(`  ✅ Threshold value:`, value);
            return ethers.BigNumber.from(value);
          }

          // Default: Convert to BigNumber
          console.log(`  ✅ Default numeric conversion:`, value);
          return ethers.BigNumber.from(value);

        } catch (error: any) {
          console.error(`  ❌ Number conversion failed:`, error.message);
          throw new Error(`Invalid number for ${param.name}. Expected a valid number.`);
        }
      }

      // ========================================
      // 5. BOOLEAN TYPE
      // ========================================
      if (paramType === 'bool') {
        let boolValue: boolean;

        if (typeof arg === 'boolean') {
          boolValue = arg;
        } else if (typeof arg === 'string') {
          const lowerArg = arg.toLowerCase().trim();
          if (lowerArg === 'true' || lowerArg === '1' || lowerArg === 'yes') {
            boolValue = true;
          } else if (lowerArg === 'false' || lowerArg === '0' || lowerArg === 'no') {
            boolValue = false;
          } else {
            throw new Error(`Invalid boolean for ${param.name}. Use: true/false`);
          }
        } else {
          boolValue = Boolean(arg);
        }

        console.log(`  ✅ Boolean value:`, boolValue);
        return boolValue;
      }

      // ========================================
      // 6. STRING TYPE (including URI)
      // ========================================
      if (paramType === 'string') {
        const stringValue = arg.toString().trim();

        // Validate URIs if parameter name suggests it
        if (
          paramName.includes('uri') ||
          paramName.includes('url') ||
          paramName.includes('link')
        ) {
          // Basic URI validation
          if (!stringValue.startsWith('http://') && 
              !stringValue.startsWith('https://') && 
              !stringValue.startsWith('ipfs://') &&
              stringValue !== '') {
            console.warn(`  ⚠️  URI doesn't start with protocol: ${stringValue}`);
            // Don't throw error, just warn - some contracts accept relative URIs
          }
        }

        console.log(`  ✅ String value:`, stringValue);
        return stringValue;
      }

      // ========================================
      // 7. BYTES TYPE
      // ========================================
      if (paramType?.startsWith('bytes')) {
        let bytesValue = arg.toString().trim();

        // Ensure 0x prefix
        if (!bytesValue.startsWith('0x')) {
          bytesValue = '0x' + bytesValue;
        }

        // Validate hex format
        if (!/^0x[0-9a-fA-F]*$/.test(bytesValue)) {
          throw new Error(`Invalid bytes format for ${param.name}. Expected hex string.`);
        }

        console.log(`  ✅ Bytes value:`, bytesValue);
        return bytesValue;
      }

      // ========================================
      // 8. ARRAY TYPES (generic)
      // ========================================
      if (paramType?.includes('[]')) {
        try {
          let arrayValue;

          // Try parsing as JSON first
          if (typeof arg === 'string') {
            try {
              arrayValue = JSON.parse(arg);
            } catch {
              // If JSON parse fails, try comma-separated
              arrayValue = arg.split(',').map((item: string) => item.trim());
            }
          } else if (Array.isArray(arg)) {
            arrayValue = arg;
          } else {
            throw new Error('Expected an array');
          }

          if (!Array.isArray(arrayValue)) {
            throw new Error('Could not parse as array');
          }

          // Process array elements based on base type
          const baseType = paramType.replace('[]', '');
          const processedArray = arrayValue.map((item: any, i: number) => {
            if (baseType.startsWith('uint') || baseType.startsWith('int')) {
              return ethers.BigNumber.from(item.toString());
            }
            return item;
          });

          console.log(`  ✅ Array value (${processedArray.length} items)`);
          return processedArray;
        } catch (error: any) {
          console.error(`  ❌ Array parsing failed:`, error.message);
          throw new Error(`Invalid array for ${param.name}. Use format: ["item1", "item2"] or item1,item2`);
        }
      }

      // ========================================
      // 9. TUPLE/STRUCT (complex types)
      // ========================================
      if (paramType?.startsWith('tuple')) {
        console.log(`  ⚠️  Tuple type detected - passing as-is`);
        // For tuples, we expect the user to provide a properly formatted object
        return arg;
      }

      // ========================================
      // 10. DEFAULT: Return as-is
      // ========================================
      console.log(`  ✅ Default pass-through for type ${paramType}`);
      return arg;
    });

    console.log('\n✅ All arguments processed successfully');
    console.log('Processed args:', processedArgs);
    console.groupEnd();

    return processedArgs;
  };

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
  
      // STEP 3: Process constructor arguments (ENHANCED)
      setProgress(30);
      const processedArgs = processConstructorArguments(template, constructorArgs);
  
      // STEP 4: Sign transaction
      setDeploymentStatus('signing');
      setProgress(40);

      const overrides = { gasLimit: 3000000 };

      // Make gas estimation optional and network-aware
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

      // Handle different transaction response formats
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

      // STEP 5: Wait for transaction to be mined
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

      // STEP 6: Check transaction status
      if (receipt.status === 0) {
        console.error('❌ Transaction reverted on-chain');
        throw new Error('Transaction failed: Contract execution reverted. Check constructor logic and parameters.');
      }

      setDeploymentStatus('confirming');
      setProgress(65);
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // STEP 7: Verify contract was actually deployed
      const deployedCode = await provider.getCode(contract.address);
      if (deployedCode === '0x' || deployedCode === '0x0') {
        console.error('❌ No bytecode found at contract address');
        throw new Error('Contract deployment failed: No bytecode at address. Contract may have self-destructed or deployment reverted.');
      }

      setDeploymentStatus('confirmed');
      setProgress(80);
      console.log(`✅ Contract deployed at: ${contract.address}`);
      console.log(`✅ Bytecode verified: ${deployedCode.length} bytes`);
  
      // STEP 8: Save to database
      setDeploymentStatus('saving');
      setProgress(90);
  
      const templateParams = Array.isArray(template.parameters) ? template.parameters : [];
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
  
      // STEP 9: Success
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