# FlowForge 🌊 — No-Code Smart Contract Deployments for BlockDAG

**Visit the live FlowForge dApp:** **[https://flowforgehq.netlify.app/](https://flowforgehq.netlify.app/)**

**FlowForge is a no-code toolkit that empowers developers, DAOs, and builders to deploy secure, pre-audited smart contracts to the BlockDAG testnet without writing a single line of Solidity.**

> Our mission is to accelerate the growth of the BlockDAG ecosystem by transforming complex contract deployment into a simple, fast, and secure visual workflow.

---

## ✅ Wave 2 Complete: Live On-Chain Deployments

FlowForge is no longer just a prototype. We have successfully achieved our Wave 2 milestone: **live, on-chain deployment of smart contracts to the BlockDAG testnet.**

| Feature                 | Status       | Description                                                                       |
| ----------------------- | ------------ | --------------------------------------------------------------------------------- |
| **Wallet Integration**  | ✅ Completed | Connect MetaMask via Wagmi v2.                                                    |
| **UI/UX Polish**        | ✅ Completed | Clean, intuitive interface built with Next.js, ShadCN, and Tailwind.              |
| **Live Contract Deployment** | ✅ **Completed** | **Users can now deploy a real ERC-20 token contract directly to the BlockDAG testnet.** |
| **Network Resilience**  | ✅ **Completed** | **Engineered robust solutions for BlockDAG-specific gas, CORS, and timeout issues.** |
| **Database Persistence**| ✅ Completed | Deployment records (including contract address and tx hash) are saved to Supabase. |
| **Explorer Verification**| ✅ Completed | Successful deployments include a direct link to view the transaction on the BlockDAG explorer. |

---

## 🏗️ Architecture Overview

FlowForge is built on a modern web stack designed for a seamless, resilient, and scalable user experience.

```
[User's Browser]
      |
      +-----> [Next.js Frontend (React, wagmi)] ----> (1. Connects Wallet)
      |         - Selects "ERC-20" Template
      |         - Inputs Parameters ("MyToken", "MTK", 1000)
      |
      +-----> [MetaMask] ---------------------------> (2. Signs Transaction)
      |
      +-----> [/api/rpc Proxy (Next.js)] -----------> (3. Forwards request to avoid CORS)
      |
      +-----> [BlockDAG Testnet] -------------------> (4. Confirms Transaction)
      |         (Returns Tx Receipt)
      |
[FlowForge Backend]
      |
      +-----> [Supabase Client] --------------------> (5. Saves Deployment Record)
                - contractName, address, deployer, transactionHash
      |
[User's Browser]
      |
      +-----> [Dashboard] --------------------------> (6. Displays Public Deployments)
```

### Tech Stack

| Layer                | Technology                                      | Purpose                               |
| -------------------- | ----------------------------------------------- | ------------------------------------- |
| **Frontend**         | Next.js (App Router) + TypeScript               | Application Framework & UI            |
| **Styling**          | TailwindCSS + ShadCN UI                         | Modern, Component-Based Design System |
| **Wallet**           | `wagmi` + `viem`                                  | EVM Wallet Connection & Interaction   |
| **Data Layer**       | Supabase                                        | Deployment Registry & History         |
| **Target Blockchain**| BlockDAG Testnet                                  | Core Deployment Target                |

---

## 🚀 Getting Started Locally

You can run a local instance of the FlowForge dApp in just a few steps.

### 1. Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.0 or later)
- [npm](https://www.npmjs.com/) (or yarn/pnpm)
- A MetaMask wallet (or any EIP-1193 compatible browser wallet) with BlockDAG testnet funds.

### 2. Setup

Clone the repository and install the dependencies:

```bash
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge
npm install
```

### 3. Environment Configuration

Create a `.env.local` file by copying the example.

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables in your new `.env.local` file:

```bash
# Get these from your Supabase Project -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# These are required for the BlockDAG network configuration
# The RPC URL is used by the Next.js proxy
NEXT_PUBLIC_BLOCKDAG_RPC_URL="https://rpc.awakening.bdagscan.com/"
NEXT_PUBLIC_BLOCKDAG_CHAIN_ID="11155111" # Example ID, use the correct one
NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL="https://testnet.bdagscan.com"
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

---

## 🗺️ Project Roadmap: Wave 3 and Beyond

With a solid foundation in place, our focus now shifts to expanding FlowForge's capabilities and ecosystem value.

| Phase  | Core Deliverable                                     | Status      |
| ------ | ---------------------------------------------------- | ----------- |
| **Wave 1** | UI Scaffold & Mocked Backend                       | ✅ Completed  |
| **Wave 2** | **Real ERC-20 Deployment to BlockDAG Testnet**     | ✅ **Completed** |
| **Wave 3** | More Templates, Contract Verification & Analytics  | 🚀 Planned     |

Our priorities for Wave 3 include:
- **More Contract Templates:** Introduce audited templates for NFTs (ERC-721), Vesting schedules, and Multi-Sig Wallets.
- **One-Click Contract Verification:** Automate the process of verifying contract source code on the BlockDAG explorer—a major friction point for developers.
- **Deployment Analytics:** Provide a simple dashboard for each deployed contract, showing key on-chain metrics like holder counts and transaction volume.
- **ContractGuardian (Exploration):** Research the integration of an AI-powered security scanner to provide a preliminary, automated check on custom contract code before deployment.

We are excited to bring more on-chain functionality to FlowForge and contribute a foundational tool to the BlockDAG community.
