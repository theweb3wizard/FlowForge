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
import { getTemplateById } from '../supabase/templates';
import { processConstructorArguments, processFunctionArguments } from '../abi/parser';
import { callReadFunction, callWriteFunction, deployContract } from '../web3/transactions';

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
   * Execute a single deploy step
   */
  private async executeDeployStep(
    step: DeployStep,
    stepResults: StepResult[],
    template: ContractTemplate,
  ): Promise<{ contractAddress: string; transactionHash: string }> {

    const processedArgs = processConstructorArguments(
      template,
      step.constructorArgs.map(arg => this.resolveValue(arg.value, stepResults))
    );

    console.log(`🚀 [Recipe Engine] Deploying: ${step.contractName}...`);
    
    const deployResult = await deployContract(
      this.signer,
      template.abi,
      template.bytecode,
      processedArgs.args,
      this.network,
    );

    console.log(`✅ [Recipe Engine] Contract deployed at: ${deployResult.contractAddress}`);

    await createDeployment({
      template_id: template.id,
      contract_name: step.contractName,
      contract_address: deployResult.contractAddress,
      deployer_address: this.address,
      network: this.network,
      chain_id: this.chainId,
      transaction_hash: deployResult.transactionHash,
      constructor_args: processedArgs.argsToSave,
      deployment_status: 'success',
    });

    return {
      contractAddress: deployResult.contractAddress,
      transactionHash: deployResult.transactionHash,
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

    let abi: any[] | undefined;
    if (typeof step.contractSource === 'object' && step.contractSource.source === 'step') {
        const deployStep = (stepResults[step.contractSource.stepIndex] as any).sourceRecipeStep as DeployStep;
        if(deployStep && deployStep.type === 'deploy') {
            const template = await getTemplateById(deployStep.templateId);
            abi = template?.abi;
        }
    }

    if (!abi) {
        throw new Error(`Could not determine ABI for interaction step targeting ${contractAddress}`);
    }

    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    const functionAbi = abi.find(
      (item: any) => item.type === 'function' && item.name === step.functionName
    );

    if (!functionAbi) {
      throw new Error(`Function "${step.functionName}" not found in ABI`);
    }

    const processedArgs = processFunctionArguments(
        step.functionArgs.map(arg => this.resolveValue(arg.value, stepResults)),
        functionAbi
    );

    console.log(`🔧 [Recipe Engine] Calling ${step.functionName} on ${contractAddress}...`);

    if (step.isWrite) {
      const result = await callWriteFunction(contract, this.signer, step.functionName, processedArgs);
      return { transactionHash: result.transactionHash, result: result.receipt };
    } else {
      const result = await callReadFunction(contract, step.functionName, processedArgs);
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
        sourceRecipeStep: step,
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
        stepResult.error = error.message || 'An unknown error occurred';
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
