'use client';

import { ethers } from 'ethers';
import { getWeb3ErrorMessage } from '../errors';
import { NetworkType } from '@/types/deployment';
import { AbiFunction, processConstructorArguments } from '../abi/parser';
import { DeploymentStatus } from '@/hooks/useDeployContract';

export interface ProcessedArgs {
    args: any[];
    argsToSave: Record<string, any>;
}

export interface DeploymentServiceResult {
    contractAddress: string;
    transactionHash: string;
}

export interface CallWriteResult {
    transactionHash: string;
    receipt: ethers.ContractReceipt;
    gasUsed: string;
}

type StatusCallback = (status: DeploymentStatus, hash?: string) => void;

const getConfirmationConfig = (network: NetworkType) => {
    const configs = {
        localnet: { confirmations: 1, timeout: 30000 },
        testnet: { confirmations: 1, timeout: 180000 },
        mainnet: { confirmations: 2, timeout: 300000 },
    };
    return configs[network] || configs.testnet;
};


export async function deployContract(
    signer: ethers.Signer,
    abi: any[],
    bytecode: string,
    constructorArgs: any[],
    network: NetworkType,
    onStatusChange?: StatusCallback
): Promise<DeploymentServiceResult> {
    
    let pollInterval: NodeJS.Timeout | undefined;

    try {
        const factory = new ethers.ContractFactory(abi, bytecode, signer);

        onStatusChange?.('preparing');
        
        const overrides = { gasLimit: 3000000 };

        if (network === 'localnet') {
            try {
                console.log('🧪 Estimating gas for deployment...');
                const deployTx = factory.getDeployTransaction(...constructorArgs, overrides);
                await signer.estimateGas(deployTx);
                console.log('✅ Gas estimation successful');
            } catch (estimateError: any) {
                let errorMsg = 'Contract deployment simulation failed. ';
                if (estimateError.message?.includes('StackOverflow')) {
                    errorMsg += 'Stack overflow detected - your contract may have infinite recursion in the constructor.';
                } else {
                    errorMsg += getWeb3ErrorMessage(estimateError);
                }
                throw new Error(errorMsg);
            }
        }

        onStatusChange?.('signing');
        console.log('📤 Sending deployment transaction...');
        const contract = await factory.deploy(...constructorArgs, overrides);
        
        const deploymentTx = contract.deployTransaction || (contract as any).deploymentTransaction;
        if (!deploymentTx || !deploymentTx.hash) {
            throw new Error('Failed to get transaction hash from deployment.');
        }

        const transactionHash = deploymentTx.hash;
        onStatusChange?.('submitted', transactionHash);
        console.log(`✅ Transaction submitted: ${transactionHash}`);
        console.log(`⏳ Waiting for network confirmation...`);

        const config = getConfirmationConfig(network);
        
        pollInterval = setInterval(async () => {
            try {
              const tx = await signer.provider!.getTransaction(transactionHash);
              if (tx && tx.blockNumber) {
                console.log(`⛏️ Transaction mined in block ${tx.blockNumber}`);
              } else {
                console.log(`🔄 Transaction pending in mempool...`);
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 3000);

        let receipt;
        try {
            receipt = await signer.provider!.waitForTransaction(transactionHash, config.confirmations, config.timeout);
        } catch (timeoutError: any) {
            throw new Error('Transaction confirmation timed out. Check block explorer for status.');
        } finally {
            clearInterval(pollInterval);
        }
        
        if (receipt.status === 0) {
            throw new Error('Transaction failed: Contract execution reverted.');
        }

        onStatusChange?.('confirming');
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        const deployedCode = await signer.provider!.getCode(contract.address);
        if (deployedCode === '0x' || deployedCode === '0x0') {
            throw new Error('Contract deployment failed: No bytecode at address.');
        }
        
        onStatusChange?.('confirmed');
        console.log(`✅ Contract deployed at: ${contract.address}`);

        return {
            contractAddress: contract.address,
            transactionHash,
        };

    } catch (error: any) {
        if (pollInterval) clearInterval(pollInterval);
        console.error('❌ Deployment Service Error:', error);
        throw new Error(getWeb3ErrorMessage(error));
    }
}

export async function callReadFunction(
    contract: ethers.Contract,
    functionName: string,
    args: any[],
    functionAbi?: AbiFunction
): Promise<any> {
    try {
        const result = await contract[functionName](...args);
        return result;
    } catch (error: any) {
        console.error('Read function error:', error);
        throw new Error(getWeb3ErrorMessage(error, functionAbi));
    }
}

export async function callWriteFunction(
    contract: ethers.Contract,
    signer: ethers.Signer,
    functionName: string,
    args: any[],
    value?: string,
    functionAbi?: AbiFunction,
    gasLimit?: string
): Promise<CallWriteResult> {
    const contractWithSigner = contract.connect(signer);
    
    try {
        const txOptions: any = {};
        if (value && parseFloat(value) > 0) {
            txOptions.value = ethers.utils.parseEther(value);
        }
        if (gasLimit) {
            txOptions.gasLimit = ethers.BigNumber.from(gasLimit);
        }

        const tx = await contractWithSigner[functionName](...args, txOptions);
        const receipt = await tx.wait();

        if (receipt.status === 0) {
            throw new Error('Transaction was reverted by the network.');
        }

        return {
            transactionHash: receipt.transactionHash,
            receipt,
            gasUsed: receipt.gasUsed.toString(),
        };
    } catch (error: any) {
        console.error('Write function error:', error);
        throw new Error(getWeb3ErrorMessage(error, functionAbi));
    }
}

export async function estimateGas(
    contract: ethers.Contract,
    signer: ethers.Signer,
    functionName: string,
    args: any[],
    value?: string
): Promise<any> {
    const contractWithSigner = contract.connect(signer);
    
    try {
        const txOptions: any = {};
        if (value && parseFloat(value) > 0) {
            txOptions.value = ethers.utils.parseEther(value);
        }

        const gasLimit = await contractWithSigner.estimateGas[functionName](...args, txOptions);
        const feeData = await signer.provider!.getFeeData();

        let estimatedCost = '0';
        if (feeData.maxFeePerGas) {
            const costInWei = gasLimit.mul(feeData.maxFeePerGas);
            estimatedCost = ethers.utils.formatEther(costInWei);
        }

        return {
            gasLimit: gasLimit.toString(),
            maxFeePerGas: feeData.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
            estimatedCost,
        };
    } catch (error: any) {
        console.error('Gas estimation error:', error);
        throw new Error(getWeb3ErrorMessage(error));
    }
}
