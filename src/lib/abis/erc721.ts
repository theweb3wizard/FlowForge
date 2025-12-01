export const erc721Abi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol_",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const erc721Bytecode = "0x608060405234801561001057600080fd5b50604051610e52380380610e52833981810160405281019061003291906104d4565b806001600160a01b03166301ffc9a760e01b178063a22cb46514610141578063b88d4fde1461015f578063c87b56dd1461017d575b600080fd5b806306fdde031461008d578063081812fc14610098578063095ea7b3146100b657806323b872dd146100d4575b600080fd5b61009661019b565b005b6100a06101a1565b6040516100ad9190610582565b60405180910390f35b6100ce60048036038101906100c991906105f8565b6101d1565b6040516100db9190610660565b60405180910390f35b6100e2610214565b6040516100ef91906106c4565b60405180910390f35b610129600480360381019061012491906106fa565b61021d565b60405161013691906106c4565b60405180910390f35b610149610292565b6040516101569190610738565b60405180910390f35b610167610298565b6040516101749190610738565b60405180910390f35b610199600480360381019061019491906107d3565b6102a0565b005b6060600480546101b090610bd8565b80601f01602080910402602001604051908101604052809291908181526020018280546101dc90610bd8565b80156102295780601f106101fe57610100808354040283529160200191610229565b820191906000526020600020905b81548152906001019060200180831161020c57829003601f168201915b5050505050905090565b61021c61019b565b50565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6000600754905090565b6060600580546102a990610bd8565b80601f01602080910402602001604051908101604052809291908181526020018280546102d590610bd8565b80156103225780601f106102f757610100808354040283529160200191610322565b820191906000526020600020905b81548152906001019060200180831161030557829003601f168201915b5050505050905090565b600081519050919050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600081519050919050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b50565b6000828152602081815260200190508082019250808252602082019150506000818152602001600020600082825401925050819055505b5050565b60008060008060008060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508073ffffffffffffffffffffffffffffffffffffffff1683836040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508152602001807f4552433732313a20617070726f766520746f206e6f6e2d6578697374656e7420746f6b656e0081525081565b8273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516104c891906106c4565b60405180910390a3505050565b6000806000606084860312156104ec576104eb610a30565b5b60006104f986828701610b38565b935050602061050a86828701610b38565b925050604061051b86828701610b6d565b9150509250925092565b600081519050919050565b600082825260208201905092915050565b60005b8381101561056557808201518184015260208101905061054a565b60008484015250505050565b600061057e601f83011261057e57fe5b046105ce565b60006020828403121561059557610594610a30565b5b60006105a384828501610b38565b91505092915050565b600080604083850312156105bf576105be610a30565b5b60006105cd85828601610b38565b92505060206105de85828601610b6d565b9150509250929050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061062b60008383610631565b905060008273ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561065c57808260005401815290565b50565b61066881610550565b82525050565b6000602082019050610683600083018461065f565b92915050565b600060408201905081810360008301526106a78184610678565b905092915050565b60006106b882610550565b91506106c383610550565b92508282019050808211156106db576106da610689565b5b92915050565b600081519050919050565b600081519050919050565b6000819050919050565b6000610714826106ee565b915061071f836106ee565b925082820190508082111561073757610736610689565b5b92915050565b6000610742826106ee565b9150819050919050565b61075281610709565b82525050565b600060208201905061076d6000830184610749565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b61079d81610709565b82525050565b60006020820190506107b86000830184610794565b92915050565b600060a08201905081810360008301526107dd818461078d565b905092915050565b6000604082019050818103600083015261080181846107b2565b905092915050565b600082825260208201905092915050565b600081519050919050565b6000819050919050565b61084281610831565b82525050565b600060208201905061085d6000830184610838565b92915050565b600060408201905081810360008301526108818184610852565b905092915050565b61089281610831565b82525050565b60006060820190506108ad6000830185610887565b6108b96020830184610887565b9392505050565b600082825260208201905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000818152602081815260200190508082019250808252602082019150506000818152602001600020600082825401925050819055505b5050565b600080600080600060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508073ffffffffffffffffffffffffffffffffffffffff1683836040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508152602001807f4552433732313a207472616e7366657220746f206e6f6e204552433732312072656365697665720081525081565b8273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610a2491906106c4565b60405180910390a350505050565b610a38610a33610b2d565b565b90565b600080600060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610b1b91906106c4565b60405180910390a35050565b600081610b33610b2d565b50565b600081815260208181526020019050808201925080825260208201915050600081815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b505050565b60006020528060005260406000206000915090505481565b610be081610550565b82525050565b6000602082019050610bfb6000830184610bd1565b92915050565b60006040820190508181036000830152610c1f8184610be6565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610c51826106ee565b9150610c5c836106ee565b9250828201905080821115610c7457610c73610689565b5b92915050565b610c8581610831565b82525050565b60006040820190508181036000830152610ca98184610c7e565b905092915050565b6000610cba82610831565b9150819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600080600283021115610d0257610d01610ca1565b5b8154610d0d8282825401610d03565b9450505050565b600082825260208201905092915050565b6000610d3a826106ee565b9150819050919050565b600081519050919050565b610d5581610d44565b82525050565b6000602082019050610d706000830184610d4b565b92915050565b60006040820190508181036000830152610d948184610d65565b905092915050565b610da581610d44565b82525050565b6000606082019050610dc06000830185610d9a565b610dcc6020830184610d9a565b9392505050565b600082825260208201905092915050565b600080600080600060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b505050505056fea26469706673582212202613c7c2964b4c100e47190f8f8303f8f6b92a2a0956b68a4d4677732d847e3364736f6c634300080c0033" as `0x${string}`;
