import type { Abi } from "viem";

export type Deployment = {
  id: number;
  contractName: string;
  address: string;
  deployer: string;
  timestamp: string;
  transactionHash?: string;
  abi?: Abi; // ABI is now part of the deployment data
};
