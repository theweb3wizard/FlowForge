export function getWeb3ErrorMessage(error: any): string {
  // User rejected transaction
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user';
  }

  // Insufficient funds
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds to complete this transaction. Please add more crypto to your wallet.';
  }

  // Gas estimation failed
  if (error.message?.includes('gas required exceeds')) {
    return 'Transaction would fail. Please check your inputs and try again.';
  }
  
  if (error.message?.includes('invalid opcode: PUSH0')) {
      return 'Deployment failed: The smart contract was compiled with an EVM version (Shanghai) that is not yet supported by the network. Please recompile with an older target (e.g., Paris).';
  }

  // Network mismatch
  if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Contract execution reverted
  if (error.message?.includes('execution reverted')) {
    const reason = error.reason || error.data?.message;
    return reason
      ? `Transaction failed: ${reason}`
      : 'Transaction failed. The contract rejected this operation.';
  }

  // Nonce issues
  if (error.message?.includes('nonce')) {
    return 'Transaction nonce error. Please try resetting your wallet account in MetaMask settings and try again.';
  }

  // Timeout
  if (error.message?.includes('timeout')) {
    return 'Transaction timeout. The network may be congested. Please try again.';
  }

  // Default
  return error.reason || error.message || 'An unexpected error occurred';
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
