import type { RecipeStep } from '@/types/recipe';

export type StarterTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<RecipeStep, 'id' | 'recipeId'>[];
};

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // -------------------------------------------------------------------------
  // 1. ERC-20 Token + Staking System
  // -------------------------------------------------------------------------
  {
    id: 'erc20-staking',
    name: 'ERC-20 Token + Staking System',
    description:
      'Deploy an ERC-20 token, then a staking contract that holds the token address from the first step.',
    category: 'DeFi',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy ERC-20 Token',
        contractName: 'MyToken',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'name', type: 'string', internalType: 'string' },
              { name: 'symbol', type: 'string', internalType: 'string' },
              { name: 'initialSupply', type: 'uint256', internalType: 'uint256' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'name', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'symbol', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'initialSupply', type: 'uint256', value: '', isVariable: false, variableRef: null },
        ],
      },
      {
        stepOrder: 1,
        stepType: 'deploy',
        label: 'Deploy Staking Contract',
        contractName: 'Staking',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'tokenAddress', type: 'address', internalType: 'address' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          {
            name: 'tokenAddress',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_0.contractAddress',
          },
        ],
      },
      {
        stepOrder: 2,
        stepType: 'interact',
        label: 'Grant Minter Role',
        contractName: null,
        abi: [
          {
            type: 'function',
            name: 'setStakingContract',
            inputs: [
              { name: 'stakingAddress', type: 'address', internalType: 'address' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: '${step_0.contractAddress}',
        functionName: 'setStakingContract',
        constructorParams: [
          {
            name: 'stakingAddress',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_1.contractAddress',
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Ownable Token + Ownership Transfer
  // -------------------------------------------------------------------------
  {
    id: 'ownable-transfer',
    name: 'Ownable Token + Ownership Transfer',
    description:
      'Deploy an ownable ERC-20 token and immediately transfer ownership to a new address.',
    category: 'Token',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy Ownable Token',
        contractName: 'OwnableToken',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'name', type: 'string', internalType: 'string' },
              { name: 'symbol', type: 'string', internalType: 'string' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'name', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'symbol', type: 'string', value: '', isVariable: false, variableRef: null },
        ],
      },
      {
        stepOrder: 1,
        stepType: 'interact',
        label: 'Transfer Ownership',
        contractName: null,
        abi: [
          {
            type: 'function',
            name: 'transferOwnership',
            inputs: [
              { name: 'newOwner', type: 'address', internalType: 'address' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: '${step_0.contractAddress}',
        functionName: 'transferOwnership',
        constructorParams: [
          { name: 'newOwner', type: 'address', value: '', isVariable: false, variableRef: null },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Token + Vesting Contract
  // -------------------------------------------------------------------------
  {
    id: 'token-vesting',
    name: 'Token + Vesting Contract',
    description:
      'Deploy an ERC-20 token and a vesting contract that receives the token address.',
    category: 'DeFi',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy ERC-20 Token',
        contractName: 'VestingToken',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'name', type: 'string', internalType: 'string' },
              { name: 'symbol', type: 'string', internalType: 'string' },
              { name: 'totalSupply', type: 'uint256', internalType: 'uint256' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'name', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'symbol', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'totalSupply', type: 'uint256', value: '', isVariable: false, variableRef: null },
        ],
      },
      {
        stepOrder: 1,
        stepType: 'deploy',
        label: 'Deploy Vesting Contract',
        contractName: 'TokenVesting',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'token', type: 'address', internalType: 'address' },
              { name: 'beneficiary', type: 'address', internalType: 'address' },
              { name: 'durationSeconds', type: 'uint256', internalType: 'uint256' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          {
            name: 'token',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_0.contractAddress',
          },
          { name: 'beneficiary', type: 'address', value: '', isVariable: false, variableRef: null },
          { name: 'durationSeconds', type: 'uint256', value: '', isVariable: false, variableRef: null },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. ERC-721 NFT Collection
  // -------------------------------------------------------------------------
  {
    id: 'erc721-nft',
    name: 'ERC-721 NFT Collection',
    description: 'Deploy a standard ERC-721 NFT collection with a configurable base URI.',
    category: 'NFT',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy NFT Collection',
        contractName: 'MyNFT',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'name', type: 'string', internalType: 'string' },
              { name: 'symbol', type: 'string', internalType: 'string' },
              { name: 'baseURI', type: 'string', internalType: 'string' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'name', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'symbol', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'baseURI', type: 'string', value: '', isVariable: false, variableRef: null },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Minimal Proxy Factory
  // -------------------------------------------------------------------------
  {
    id: 'proxy-factory',
    name: 'Minimal Proxy Factory',
    description:
      'Deploy an implementation contract, then a factory that clones it cheaply using EIP-1167.',
    category: 'Infrastructure',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy Implementation',
        contractName: 'Implementation',
        abi: [
          {
            type: 'constructor',
            inputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [],
      },
      {
        stepOrder: 1,
        stepType: 'deploy',
        label: 'Deploy Proxy Factory',
        contractName: 'ProxyFactory',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'implementation', type: 'address', internalType: 'address' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          {
            name: 'implementation',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_0.contractAddress',
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. DAO: Token + Governor
  // -------------------------------------------------------------------------
  {
    id: 'dao-governor',
    name: 'DAO: Token + Governor',
    description:
      'Deploy an ERC-20Votes governance token, a TimelockController, and an OZ Governor contract.',
    category: 'Governance',
    steps: [
      {
        stepOrder: 0,
        stepType: 'deploy',
        label: 'Deploy Governance Token',
        contractName: 'GovernanceToken',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'name', type: 'string', internalType: 'string' },
              { name: 'symbol', type: 'string', internalType: 'string' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'name', type: 'string', value: '', isVariable: false, variableRef: null },
          { name: 'symbol', type: 'string', value: '', isVariable: false, variableRef: null },
        ],
      },
      {
        stepOrder: 1,
        stepType: 'deploy',
        label: 'Deploy TimelockController',
        contractName: 'TimelockController',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'minDelay', type: 'uint256', internalType: 'uint256' },
              { name: 'proposers', type: 'address[]', internalType: 'address[]' },
              { name: 'executors', type: 'address[]', internalType: 'address[]' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          { name: 'minDelay', type: 'uint256', value: '172800', isVariable: false, variableRef: null },
          { name: 'proposers', type: 'address[]', value: '[]', isVariable: false, variableRef: null },
          { name: 'executors', type: 'address[]', value: '[]', isVariable: false, variableRef: null },
        ],
      },
      {
        stepOrder: 2,
        stepType: 'deploy',
        label: 'Deploy Governor',
        contractName: 'MyGovernor',
        abi: [
          {
            type: 'constructor',
            inputs: [
              { name: 'token', type: 'address', internalType: 'address' },
              { name: 'timelock', type: 'address', internalType: 'address' },
              { name: 'votingDelay', type: 'uint48', internalType: 'uint48' },
              { name: 'votingPeriod', type: 'uint32', internalType: 'uint32' },
            ],
            stateMutability: 'nonpayable',
          },
        ],
        bytecode: null,
        targetAddress: null,
        functionName: null,
        constructorParams: [
          {
            name: 'token',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_0.contractAddress',
          },
          {
            name: 'timelock',
            type: 'address',
            value: '',
            isVariable: true,
            variableRef: 'step_1.contractAddress',
          },
          { name: 'votingDelay', type: 'uint48', value: '7200', isVariable: false, variableRef: null },
          { name: 'votingPeriod', type: 'uint32', value: '50400', isVariable: false, variableRef: null },
        ],
      },
    ],
  },
];
