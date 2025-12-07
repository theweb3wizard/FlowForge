
export type Deployment = {
  id: number;
  contractName: string;
  address: string;
  deployer: string;
  timestamp: string;
  transactionHash?: string;
};
