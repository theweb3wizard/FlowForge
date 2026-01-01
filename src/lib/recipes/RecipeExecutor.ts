'use client';

import { ethers } from 'ethers';
import { 
  Recipe, 
  StepResult, 
  DeployStep, 
  InteractStep,
  VariableReference 
} from '@/types/recipe';
import { ContractTemplate } from '@/types/template';
import { NetworkType } from '@/types/deployment';
import { createDeployment } from '@/lib/supabase/deployments';
import { getWeb3ErrorMessage } from '@/lib/errors';
import { getTemplateById } from '../supabase/templates';

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


export class RecipeExecutor {
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;
  private address: string;
  private network: NetworkType;
  private chainId: number;

  constructor(provider: ethers.providers.Provider, signer: ethers.Signer, address: string, network: NetworkType, chainId: number) {
    this.provider = provider;
    this.signer = signer;
    this.address = address;
    this.network = network;
    this.chainId = chainId;
  }

  /**
   * Resolve variable references in arguments
   */
    private resolveValue(value: string | VariableReference, stepResults: StepResult[]): string {
        if (typeof value !== 'object' || value === null || !('source' in value)) {
            // It's a static string value
            return String(value);
        }

        if (value.source === 'step') {
            const { stepIndex, property } = value;
            const referencedStepResult = stepResults[stepIndex];

            if (!referencedStepResult || referencedStepResult.status !== 'success') {
                throw new Error(`Cannot resolve variable: Step ${stepIndex + 1} did not complete successfully.`);
            }
            
            // Handle different properties
            switch (property) {
                case 'contractAddress':
                    if (referencedStepResult.contractAddress) {
                        return referencedStepResult.contractAddress;
                    }
                    break;
                case 'transactionHash':
                    if (referencedStepResult.transactionHash) {
                        return referencedStepResult.transactionHash;
                    }
                    break;
                case 'result':
                     if (referencedStepResult.result !== undefined && referencedStepResult.result !== null) {
                        return String(referencedStepResult.result);
                    }
                    break;
            }

            throw new Error(`Cannot resolve variable: Property "${property}" not found or is empty in the result of Step ${stepIndex + 1}.`);
        }
        
        // Fallback for unexpected types
        return String(value);
    }
  
  /**
   * Process constructor arguments with variable resolution
   */
  private processArgs(args: any[], stepResults: StepResult[], abiParams: any[]): any[] {
    return args.map((arg, index) => {
      const param = abiParams[index];
      if (!param) return arg;
  
      const resolvedValue = this.resolveValue(arg, stepResults);
      const paramType = param.type;
  
      // Type conversion
      if (paramType?.startsWith('uint') || paramType?.startsWith('int')) {
        return toBigNumberSafe(resolvedValue);
      }
      if (paramType === 'bool') {
        const trimmedValue = typeof resolvedValue === 'string' ? resolvedValue.trim().toLowerCase() : resolvedValue;
        return trimmedValue === 'true' || trimmedValue === true;
      }
      if (paramType?.includes('[]')) {
        let arrayValue: any[];
        
        if (typeof resolvedValue === 'string') {
          try {
            arrayValue = JSON.parse(resolvedValue);
          } catch {
            arrayValue = resolvedValue.split(',').map((item: string) => item.trim());
          }
        } else {
          arrayValue = Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue];
        }

        if (paramType.match(/u?int\d*\[\]/)) {
          return arrayValue.map((item) => toBigNumberSafe(item));
        }

        return arrayValue;
      }
      
      if (typeof resolvedValue === 'string') {
        return resolvedValue.trim();
      }
      
      return resolvedValue;
    });
  }

  /**
   * Execute a single deploy step
   */
  private async executeDeployStep(
    step: DeployStep,
    stepResults: StepResult[],
    template: ContractTemplate,
  ): Promise<{ contractAddress: string; transactionHash: string }> {

    const bytecodeWithPrefix = template.bytecode.startsWith('0x')
      ? template.bytecode
      : `0x${template.bytecode}`;

    const factory = new ethers.ContractFactory(
      template.abi,
      bytecodeWithPrefix,
      this.signer
    );

    const templateParams = Array.isArray(template.parameters) ? template.parameters : [];
    const processedArgs = this.processArgs(
      step.constructorArgs.map(arg => arg.value),
      stepResults,
      templateParams
    );

    const overrides = { gasLimit: 3000000 };

    console.log(`🚀 [Recipe Engine] Deploying: ${step.contractName}...`);
    const contract = await factory.deploy(...processedArgs, overrides);

    const deploymentTx = contract.deployTransaction || (contract as any).deploymentTransaction;
    if (!deploymentTx || !deploymentTx.hash) {
      throw new Error('Failed to get transaction hash from deployment');
    }

    const transactionHash = deploymentTx.hash;
    console.log(`✅ [Recipe Engine] Transaction submitted: ${transactionHash}`);

    const confirmationConfig = {
      localnet: { confirmations: 1, timeout: 30000 },
      testnet: { confirmations: 1, timeout: 180000 },
      mainnet: { confirmations: 2, timeout: 300000 },
    };
    const config = confirmationConfig[this.network] || confirmationConfig.testnet;

    const receipt = await this.provider.waitForTransaction(
      transactionHash,
      config.confirmations,
      config.timeout
    );

    if (receipt.status === 0) {
      throw new Error('Transaction reverted on-chain');
    }

    const deployedCode = await this.provider.getCode(contract.address);
    if (deployedCode === '0x' || deployedCode === '0x0') {
      throw new Error('No bytecode at contract address');
    }

    console.log(`✅ [Recipe Engine] Contract deployed at: ${contract.address}`);

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
      deployer_address: this.address,
      network: this.network,
      chain_id: this.chainId,
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
   * Execute a single interact step
   */
  private async executeInteractStep(
    step: InteractStep,
    stepResults: StepResult[],
  ): Promise<{ result?: any; transactionHash?: string }> {
    const contractAddress = this.resolveValue(step.contractSource, stepResults);

    // To get the ABI, we need to find the original deployment step
    let abi: any[] | undefined;
    if (typeof step.contractSource === 'object' && step.contractSource.source === 'step') {
        const deployStep = stepResults[step.contractSource.stepIndex];
        // This is a weak link. We need to fetch the template ABI.
        // Let's assume for now the recipe contains enough info, or we fetch it.
        // The proper way is to look up the template from the original deployment step.
        // This requires modifying how we track steps. Let's make an assumption and fetch.
        const sourceRecipeStep = stepResults[step.contractSource.stepIndex].sourceRecipeStep as DeployStep | undefined;
        if(sourceRecipeStep && sourceRecipeStep.type === 'deploy') {
            const template = await getTemplateById(sourceRecipeStep.templateId);
            abi = template?.abi;
        }
    }

    if (!abi) {
        throw new Error(`Could not determine ABI for interaction step targeting ${contractAddress}`);
    }

    const contract = new ethers.Contract(contractAddress, abi, this.signer);
    const functionAbi = abi.find(
      (item: any) => item.type === 'function' && item.name === step.functionName
    );

    if (!functionAbi) {
      throw new Error(`Function "${step.functionName}" not found in ABI`);
    }

    const processedArgs = this.processArgs(
        step.functionArgs.map(arg => arg.value),
        stepResults,
        functionAbi.inputs
    );

    console.log(`🔧 [Recipe Engine] Calling ${step.functionName} on ${contractAddress}...`);

    if (step.isWrite) {
      const tx = await contract[step.functionName](...processedArgs);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error('Transaction reverted');
      return { transactionHash: tx.hash, result: receipt };
    } else {
      const result = await contract[step.functionName](...processedArgs);
      return { result };
    }
  }

  /**
   * Execute the entire recipe
   */
  public async execute(
    recipe: Recipe,
    templates: Map<string, ContractTemplate>,
    onStepComplete: (stepIndex: number, result: StepResult) => void
  ): Promise<StepResult[]> {
    const stepResults: StepResult[] = [];
    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      const stepResult: StepResult = {
        stepIndex: i,
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      try {
        if (step.type === 'deploy') {
          const template = templates.get(step.templateId);
          if (!template) throw new Error(`Template not found: ${step.templateId}`);
          const result = await this.executeDeployStep(step, stepResults, template);
          stepResult.status = 'success';
          stepResult.contractAddress = result.contractAddress;
          stepResult.transactionHash = result.transactionHash;
        } else if (step.type === 'interact') {
           const result = await this.executeInteractStep(step, stepResults);
           stepResult.status = 'success';
           stepResult.transactionHash = result.transactionHash;
           stepResult.result = result.result;
        }

        stepResult.completedAt = new Date().toISOString();
        stepResults.push(stepResult);
        onStepComplete(i, stepResult);

        // Small delay between steps
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (error: any) {
        stepResult.status = 'error';
        stepResult.error = getWeb3ErrorMessage(error);
        stepResult.completedAt = new Date().toISOString();
        stepResults.push(stepResult);
        onStepComplete(i, stepResult);
        // Re-throw to stop the entire execution
        throw error;
      }
    }
    return stepResults;
  }
}
