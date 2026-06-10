export function formatExecutionError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const lower = message.toLowerCase();

  if (message.includes('User rejected') || message.includes('user rejected')) {
    return 'Transaction was rejected in wallet.';
  }

  if (lower.includes('insufficient funds') || lower.includes('insufficient balance')) {
    return 'Insufficient funds for gas + value. Add more ETH to your wallet.';
  }

  if (lower.includes('nonce') && lower.includes('low')) {
    return 'Nonce too low. Try resetting your wallet activity or waiting for pending transactions.';
  }

  if (lower.includes('gas') && (lower.includes('estimate') || lower.includes('limit'))) {
    return 'Gas estimation failed. The transaction may revert or be too complex.';
  }

  if (lower.includes('revert') || lower.includes('execution reverted')) {
    return 'Transaction reverted on-chain. Check your contract logic and parameters.';
  }

  if (lower.includes('chain') && (lower.includes('not supported') || lower.includes('wrong'))) {
    return 'Chain not supported. Switch to a supported network in your wallet.';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Transaction timed out. The network may be congested. Try again.';
  }

  if (lower.includes('already known') || lower.includes('replacement') || lower.includes('underpriced')) {
    return 'Transaction already submitted. Wait for confirmation or increase gas.';
  }

  return 'Transaction failed. Check the network, funds, and contract state, then try again.';
}
