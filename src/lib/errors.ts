import { AbiFunction } from "@/types/abi";
import { ethers } from "ethers";

export function getWeb3ErrorMessage(error: any, functionAbi?: AbiFunction): string {
    // User rejected transaction
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return 'Transaction rejected by user';
    }
  
    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      return 'Insufficient funds to complete this transaction. Please add more crypto to your wallet.';
    }
  
    // Gas estimation failed
    if (error.message?.includes('gas required exceeds')) {
      return 'Transaction would fail. Please check your inputs and try again.';
    }
    
    if (error.message?.includes('invalid opcode: PUSH0')) {
        return 'Deployment failed: The smart contract was compiled with an EVM version (Shanghai) that is not yet supported by the network. Please recompile with an older target (e.g., Paris).';
    }

    // Try to decode custom error from data
    if (error.data) {
        try {
            const errorSelector = error.data.slice(0, 10);
            const commonErrors: Record<string, string> = {
                '0x08c379a0': 'Error', // Standard revert(string)
                '0x4e487b71': 'Panic', // Panic(uint256)
            };

            if (commonErrors[errorSelector]) {
                if (error.data.length > 10) {
                    try {
                        const decoded = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + error.data.slice(10));
                        return `Reverted: ${decoded[0]}`;
                    } catch { /* fallback */ }
                }
                return commonErrors[errorSelector];
            }
        } catch (decodeError) {
            // Ignore if decoding fails
        }
    }
  
    // Network mismatch or error
    if (error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
  
    // Contract execution reverted
    if (error.reason) {
        return `Transaction failed: ${error.reason}`;
    }
    if (error.message?.includes('execution reverted')) {
        return 'Transaction failed. The contract rejected this operation.';
    }
  
    // Nonce issues
    if (error.message?.includes('nonce has already been used') || error.message?.includes('replacement transaction underpriced')) {
      return 'Transaction nonce error. Please try resetting your wallet account in MetaMask (Settings > Advanced > Reset Account) and try again.';
    }
  
    // Timeout
    if (error.message?.includes('timeout')) {
      return 'Transaction timeout. The network may be congested. Please try again.';
    }
  
    // Default
    return error.message || 'An unexpected error occurred';
}
  
  export function getSupabaseErrorMessage(error: any): string {
    if (error.message?.includes('duplicate key')) {
      return 'This record already exists';
    }
  
    if (error.message?.includes('foreign key')) {
      return 'Invalid reference to related data';
    }
  
    if (error.message?.includes('not found')) {
      return 'The requested data was not found';
    }
  
    return error.message || 'Database error occurred';
  }
  