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
    if (typeof value === 'string') {
      // It's a static value, but could be a placeholder that needs to be implemented.
      // For now, we only handle direct variable references.
      return value;
    }

    if (typeof value === 'object' && value.source === 'step') {
      const { stepIndex, property } = value;
      const referencedStepResult = stepResults[stepIndex];

      if (!referencedStepResult || referencedStepResult.status !== 'success') {
        throw new Error(`Cannot resolve variable: Step ${stepIndex + 1} did not complete successfully.`);
      }

      if (property === 'contractAddress' && referencedStepResult.contractAddress) {
        return referencedStepResult.contractAddress;
      }
      if (property === 'transactionHash' && referencedStepResult.transactionHash) {
        return referencedStepResult.transactionHash;
      }
      if (property === 'result' && referencedStepResult.result !== undefined) {
        return String(referencedStepResult.result);
      }

      throw new Error(`Cannot resolve variable: Property "${property}" not found in the result of Step ${stepIndex + 1}.`);
    }
    
    // Fallback for unexpected types
    return String(value);
  }
  
  /**
   * Process constructor arguments with variable resolution
   */
  private processConstructorArgs(args: any[], stepResults: StepResult[], templateParams: any[]): any[] {
    return args.map((arg, index) => {
      const param = templateParams[index];
      if (!param) return arg;
  
      // Resolve variable if the argument is a VariableReference object
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
        
        // Parse array if it's a string
        if (typeof resolvedValue === 'string') {
          try {
            arrayValue = JSON.parse(resolvedValue);
          } catch {
            arrayValue = resolvedValue.split(',').map((item: string) => item.trim());
          }
        } else {
          arrayValue = Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue];
        }

        // If it's an array of integers, convert each element safely
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
    const processedArgs = this.processConstructorArgs(
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
    abi: any[]
  ): Promise<{ result?: any; transactionHash?: string }> {
    const contractAddress = this.resolveValue(step.contractSource, stepResults);
    const contract = new ethers.Contract(contractAddress, abi, this.signer);
    const functionAbi = abi.find(
      (item) => item.type === 'function' && item.name === step.functionName
    );

    if (!functionAbi) {
      throw new Error(`Function "${step.functionName}" not found in ABI`);
    }

    const processedArgs = step.functionArgs.map((arg) => {
      const resolvedValue = this.resolveValue(arg.value, stepResults);
      if (arg.type.startsWith('uint') || arg.type.startsWith('int')) return toBigNumberSafe(resolvedValue);
      if (arg.type === 'bool') return resolvedValue.toString().toLowerCase() === 'true';
      return resolvedValue;
    });

    console.log(`🔧 [Recipe Engine] Calling ${step.functionName} on ${contractAddress}...`);

    if (step.isWrite) {
      const tx = await contract[step.functionName](...processedArgs);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error('Transaction reverted');
      return { transactionHash: tx.hash, result: receipt };
    } else {
      const result = await contract[step.functionName](...processedArgs);
      return { result: result.toString() };
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
          // Placeholder for interaction logic
           throw new Error('Interaction steps are not yet implemented in the executor.');
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
