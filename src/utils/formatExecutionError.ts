export function formatExecutionError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');

  if (message.includes('User rejected')) {
    return 'Transaction was rejected in wallet.';
  }

  if (message.toLowerCase().includes('revert')) {
    return 'Transaction reverted on-chain. Check your contract logic.';
  }

  return 'Transaction failed. Please check the network and try again.';
}
