export type Deployment = {
  id: string;
  contractName: string;
  address: string;
  deployer: string;
  timestamp: string;
};

export const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep_1',
    contractName: 'Standard Token (ERC-20)',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    deployer: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dep_2',
    contractName: 'NFT Collection (ERC-721)',
    address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    deployer: '0x1234567890123456789012345678901234567890',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dep_3',
    contractName: 'Multi-Sig Wallet',
    address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    deployer: '0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEf',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
