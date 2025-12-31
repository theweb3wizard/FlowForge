# FlowForge - Smart Contract Orchestration Platform

FlowForge is a high-efficiency platform for deploying and orchestrating interconnected smart contract systems on BlockDAG and other EVM-compatible networks. It transforms complex, multi-step deployment procedures into simple, repeatable workflows.

## Wave 4: Workflow Abstraction

In response to feedback from Wave 3, FlowForge has evolved beyond single deployments. We've introduced **Recipes**, a powerful form of **Workflow Abstraction** that addresses a core developer pain point. Instead of manually executing a sequence of transactions, developers can now define a dependent series of deployments and interactions as a single, reusable "Recipe." FlowForge handles the state, passes outputs from one step as inputs to the next, and ensures the entire system is deployed correctly every time. This is our practical and powerful interpretation of bringing Account Abstraction principles to the developer experience.

## Features

-   📋 **Dynamic Template Library**: Browse pre-audited contract templates fetched directly from a database.
-   🚀 **One-Click Deployment**: Deploy single contracts with a simple, auto-generated form.
-   ✨ **Batch Deployment**: Queue up multiple contracts and deploy them all in a single, sequential transaction flow.
-   📜 **Recipes (Workflow Abstraction)**: Define, save, and execute multi-step deployment and interaction sequences. Automate complex setups like token launches and eliminate manual errors.
-   🔍 **Contract Interaction**: Read and write to any function on your deployed contracts directly from the UI.
-   📊 **Deployment Dashboard**: Track your personal and all public deployments in real-time.
-   🌐 **Multi-Network Support**: Seamlessly switch between testnet, mainnet, and local development networks.

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm or yarn
-   A Web3 wallet (MetaMask, etc.)
-   Supabase account for database and template storage

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/theweb3wizard/FlowForge.git
    cd FlowForge
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local` with your values, including your Supabase URL and anon key.

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:9002](http://localhost:9002)

## Usage

### Deploying a Single Contract

1.  Connect your wallet.
2.  Browse available templates on the home page.
3.  Click "Deploy Now" on a template.
4.  Fill in the auto-generated constructor parameters.
5.  Click "Deploy Contract" and sign the transaction in your wallet.

### Using Batch Deployment & Recipes

1.  Click "Add to Batch" on any number of contract templates.
2.  Open the "Batch Deploy" cart.
3.  Configure the parameters for each contract in the sequence. For subsequent steps, you can reference outputs from previous steps (e.g., `${step1.contractAddress}`).
4.  Click "Deploy All" and confirm each transaction as it appears.
5.  The system will automatically wait for each deployment to complete before starting the next.

## Tech Stack

-   **Frontend**: Next.js 15, React 18, TailwindCSS, shadcn/ui
-   **Web3**: ethers.js, wagmi, viem
-   **Database**: Supabase (PostgreSQL) for template and deployment storage
-   **Blockchain**: BlockDAG Network, Hardhat (Local)

## Project Structure

```
src/
├── app/              # Next.js pages and routes
├── components/       # React components (common, deployment, interaction, batch)
├── contexts/         # React contexts (WalletContext, BatchContext)
├── hooks/            # Custom hooks (useDeployContract, useBatchDeploy)
├── lib/              # Core logic (ABI parsing, Supabase helpers, Web3 utils)
├── types/            # TypeScript type definitions
└── ...
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
