const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function truncateAddress(address: string): string {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isAddress(value: string): boolean {
  return ADDRESS_REGEX.test(value);
}
