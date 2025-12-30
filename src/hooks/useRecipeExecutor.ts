'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { 
  Recipe, 
  RecipeStep, 
  StepResult, 
  DeployStep, 
  InteractStep,
  VariableReference 
} from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { detectNetwork } from '@/lib/web3/network';
import { NetworkType } from '@/types/deployment';
import { createDeployment } from '@/lib/supabase/deployments';
import { 
  createRecipeExecution, 
  updateRecipeExecution,
  incrementRecipeExecutionCount 
} from '@/lib/supabase/recipes';
import { getWeb3ErrorMessage } from '@/lib/errors';

interface ExecutionState {
  isExecuting: boolean;
  currentStepIndex: number;
  stepResults: StepResult[];
  executionId?: string;
}

export function useRecipeExecutor() {
  const { address, provider } = useWallet();
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    currentStepIndex: -1,
    stepResults: [],
  });

  /**
   * Resolve variable references in arguments
   */
  const resolveValue = useCallback(
    (value: string | VariableReference, stepResults: StepResult[]): string => {
      if (typeof value === 'string') {
        return value;
      }

      // Handle variable reference
      const { stepIndex, property } = value;
      const stepResult = stepResults[stepIndex];

      if (!stepResult || stepResult.status !== 'success') {
        throw new Error(`Cannot reference step ${stepIndex}: step not completed successfully`);
      }

      // Get the property from the step result
      if (property === 'contractAddress' && stepResult.contractAddress) {
        return stepResult.contractAddress;
      }
      if (property === 'transactionHash' && stepResult.transactionHash) {
        return stepResult.transactionHash;
      }
      if (property === 'result' && stepResult.result !== undefined) {
        return String(stepResult.result);
      }

      throw new Error(`Property "${property}" not found in step ${stepIndex} result`);
    },
    []
  );

  /**
   * Process constructor arguments with variable resolution
   */
  const processConstructorArgs = useCallback(
    (args: any[], stepResults: StepResult[], templateParams: any[]): any[] => {
      return args.map((arg, index) => {
        const param = templateParams[index];
        if (!param) return arg;

        // Resolve variable if needed
        const resolvedValue = resolveValue(arg, stepResults);
        const paramType = param.type;

        // Type conversion
        if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
          return ethers.BigNumber.from(resolvedValue);
        }
        if (paramType === 'bool') {
          return resolvedValue === 'true' || resolvedValue === true;
        }
        if (paramType?.includes('[]')) {
          try {
            return JSON.parse(resolvedValue);
          } catch {
            return resolvedValue.split(',').map((item: string) => item.trim());
          }
        }
        return resolvedValue;
      });
    },
    [resolveValue]
  );

  /**
   * Execute a deploy step
   */
  const executeDeployStep = async (
    step: DeployStep,
    stepResults: StepResult[],
    template: ContractTemplate,
    network: NetworkType,
    chainId: number
  ): Promise<{ contractAddress: string; transactionHash: string }> => {
    if (!provider || !address) {
      throw new Error('Wallet not connected');
    }

    const signer = await provider.getSigner();
    
    const bytecodeWithPrefix = template.bytecode.startsWith('0x')
      ? template.bytecode
      : `0x${template.bytecode}`;

    const factory = new ethers.ContractFactory(
      template.abi,
      bytecodeWithPrefix,
      signer
    );

    // Process constructor arguments with variable resolution
    const templateParams = Array.isArray(template.parameters) ? template.parameters : [];
    const processedArgs = processConstructorArgs(
      step.constructorArgs.map(arg => arg.value),
      stepResults,
      templateParams
    );

    const overrides = { gasLimit: 3000000 };

    // Deploy contract
    console.log(`🚀 [Recipe] Deploying: ${step.contractName}...`);
    const contract = await factory.deploy(...processedArgs, overrides);

    const deploymentTx = contract.deployTransaction || (contract as any).deploymentTransaction;
    if (!deploymentTx || !deploymentTx.hash) {
      throw new Error('Failed to get transaction hash from deployment');
    }

    const transactionHash = deploymentTx.hash;
    console.log(`✅ [Recipe] Transaction submitted: ${transactionHash}`);

    // Wait for confirmation
    const confirmationConfig = {
      localnet: { confirmations: 1, timeout: 30000 },
      testnet: { confirmations: 1, timeout: 180000 },
      mainnet: { confirmations: 2, timeout: 300000 },
    };
    const config = confirmationConfig[network] || confirmationConfig.testnet;

    const receipt = await provider.waitForTransaction(
      transactionHash,
      config.confirmations,
      config.timeout
    );

    if (receipt.status === 0) {
      throw new Error('Transaction reverted on-chain');
    }

    // Verify bytecode
    const deployedCode = await provider.getCode(contract.address);
    if (deployedCode === '0x' || deployedCode === '0x0') {
      throw new Error('No bytecode at contract address');
    }

    console.log(`✅ [Recipe] Contract deployed at: ${contract.address}`);

    // Save to database
    const constructorArgsToSave = Object.fromEntries(
      templateParams.map((param, i) => [
        param.name, 
        step.constructorArgs[i]?.value || ''
      ])
    );

    await createDeployment({
      template_id: template.id,
      contract_name: step.contractName,
      contract_address: contract.address,
      deployer_address: address,
      network: network,
      chain_id: chainId,
      transaction_hash: transactionHash,
      constructor_args: constructorArgsToSave,
      deployment_status: 'success',
    });

    return {
      contractAddress: contract.address,
      transactionHash: transactionHash,
    };
  };

  /**
   * Execute an interact step
   */
  const executeInteractStep = async (
    step: InteractStep,
    stepResults: StepResult[],
    abi: any[]
  ): Promise<{ result?: any; transactionHash?: string }> => {
    if (!provider || !address) {
      throw new Error('Wallet not connected');
    }

    // Resolve contract address
    const contractAddress = resolveValue(step.contractSource, stepResults);
    
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Find function in ABI
    const functionAbi = abi.find(
      (item) => item.type === 'function' && item.name === step.functionName
    );

    if (!functionAbi) {
      throw new Error(`Function "${step.functionName}" not found in ABI`);
    }

    // Process function arguments with variable resolution
    const processedArgs = step.functionArgs.map((arg) => {
      const resolvedValue = resolveValue(arg.value, stepResults);
      
      // Type conversion based on arg.type
      if (arg.type.startsWith('uint') || arg.type.startsWith('int')) {
        return ethers.BigNumber.from(resolvedValue);
      }
      if (arg.type === 'bool') {
        return resolvedValue === 'true' || resolvedValue === true;
      }
      if (arg.type.includes('[]')) {
        try {
          return JSON.parse(resolvedValue);
        } catch {
          return resolvedValue.split(',').map((item: string) => item.trim());
        }
      }
      return resolvedValue;
    });

    console.log(`🔧 [Recipe] Calling ${step.functionName} on ${contractAddress}...`);

    if (step.isWrite) {
      // Write function - requires transaction
      const tx = await contract[step.functionName](...processedArgs);
      console.log(`✅ [Recipe] Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted');
      }

      console.log(`✅ [Recipe] Function executed successfully`);

      return {
        transactionHash: tx.hash,
        result: receipt,
      };
    } else {
      // Read function - no transaction
      const result = await contract[step.functionName](...processedArgs);
      console.log(`✅ [Recipe] Function result:`, result);

      return {
        result: result.toString(),
      };
    }
  };

  /**
   * Execute entire recipe
   */
  const executeRecipe = async (
    recipe: Recipe,
    templates: Map<string, ContractTemplate>,
    onStepComplete?: (stepIndex: number, result: StepResult) => void
  ): Promise<void> => {
    if (!address || !provider) {
      throw new Error('Please connect your wallet first');
    }

    setExecutionState({
      isExecuting: true,
      currentStepIndex: 0,
      stepResults: [],
    });

    // Detect network
    const networkResult = await detectNetwork(provider);
    if (!networkResult.isCorrectNetwork) {
      throw new Error(networkResult.error || 'Please connect to a supported network');
    }

    const network = networkResult.config.type as NetworkType;
    const chainId = networkResult.config.chainId;

    // Create execution record
    const execution = await createRecipeExecution(recipe.id, address, recipe.steps.length);
    if (!execution) {
      throw new Error('Failed to create execution record');
    }

    setExecutionState((prev) => ({
      ...prev,
      executionId: execution.id,
    }));

    const stepResults: StepResult[] = [];

    try {
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];

        setExecutionState((prev) => ({
          ...prev,
          currentStepIndex: i,
        }));

        // Initialize step result
        const stepResult: StepResult = {
          stepIndex: i,
          status: 'running',
          startedAt: new Date().toISOString(),
        };

        console.log(`\n📋 [Recipe] Step ${i + 1}/${recipe.steps.length}`);

        try {
          if (step.type === 'deploy') {
            // Get template
            const template = templates.get(step.templateId);
            if (!template) {
              throw new Error(`Template not found: ${step.templateId}`);
            }

            const result = await executeDeployStep(step, stepResults, template, network, chainId);
            
            stepResult.status = 'success';
            stepResult.contractAddress = result.contractAddress;
            stepResult.transactionHash = result.transactionHash;
            stepResult.completedAt = new Date().toISOString();

          } else if (step.type === 'interact') {
            // Get ABI from previous deploy step or passed template
            let abi: any[] = [];
            
            if (step.contractSource.startsWith('step:')) {
              const sourceStepIndex = parseInt(step.contractSource.split(':')[1]);
              const sourceStep = recipe.steps[sourceStepIndex] as DeployStep;
              const template = templates.get(sourceStep.templateId);
              if (template) {
                abi = template.abi;
              }
            }

            if (abi.length === 0) {
              throw new Error('Cannot determine ABI for interaction step');
            }

            const result = await executeInteractStep(step, stepResults, abi);
            
            stepResult.status = 'success';
            stepResult.result = result.result;
            stepResult.transactionHash = result.transactionHash;
            stepResult.completedAt = new Date().toISOString();
          }

          stepResults.push(stepResult);
          
          // Update execution in database
          await updateRecipeExecution(execution.id, {
            current_step: i + 1,
            step_results: stepResults,
          });

          // Notify callback
          if (onStepComplete) {
            onStepComplete(i, stepResult);
          }

          // Small delay between steps
          await new Promise((resolve) => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.error(`❌ [Recipe] Step ${i + 1} failed:`, error);

          stepResult.status = 'error';
          stepResult.error = getWeb3ErrorMessage(error);
          stepResult.completedAt = new Date().toISOString();

          stepResults.push(stepResult);

          // Update execution as failed
          await updateRecipeExecution(execution.id, {
            status: 'failed',
            current_step: i,
            step_results: stepResults,
            error_message: stepResult.error,
            completed_at: new Date().toISOString(),
          });

          throw error;
        }
      }

      // All steps completed successfully
      await updateRecipeExecution(execution.id, {
        status: 'completed',
        current_step: recipe.steps.length,
        step_results: stepResults,
        completed_at: new Date().toISOString(),
      });

      // Increment recipe execution count
      await incrementRecipeExecutionCount(recipe.id);

      console.log(`\n🎉 [Recipe] Execution complete!`);

    } finally {
      setExecutionState({
        isExecuting: false,
        currentStepIndex: -1,
        stepResults: stepResults,
      });
    }
  };

  return {
    executeRecipe,
    executionState,
  };
}