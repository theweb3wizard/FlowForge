# FlowForge - Smart Contract Deployment Platform

FlowForge is a user-friendly platform for deploying and interacting with smart contracts on BlockDAG networks.

## Features

- 📋 **Template Library**: Browse pre-built contract templates
- 🚀 **One-Click Deployment**: Deploy contracts with a simple form
- 🔍 **Contract Interaction**: Read and write contract functions
- 📊 **Deployment Dashboard**: Track all your deployments
- 🌐 **Multi-Network**: Support for testnet, mainnet, and local networks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, etc.)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BLOCKDAG_RPC_URL=https://rpc.awakening.bdagscan.com/
NEXT_PUBLIC_BLOCKDAG_CHAIN_ID=your_chain_id
NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL=https://testnet.bdagscan.com
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:9002](http://localhost:9002)

## Database Setup

Run the SQL migration in your Supabase SQL Editor.

## Usage

### Deploying a Contract

1. Connect your wallet
2. Browse templates on the home page
3. Click "Deploy" on a template
4. Fill in the constructor parameters
5. Click "Deploy Contract" and sign the transaction
6. View your deployment in the dashboard

### Interacting with Contracts

1. Go to Dashboard → My Contracts
2. Click "Interact with Contract"
3. Use the Read Functions tab to query contract state
4. Use the Write Functions tab to execute transactions (deployer only)

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS
- **Web3**: ethers.js, wagmi
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: BlockDAG Network

## Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
├── hooks/            # Custom hooks
├── lib/              # Utilities and helpers
├── types/            # TypeScript types
└── contexts/         # React contexts
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License

## Support

For issues and questions, please open a GitHub issue.
