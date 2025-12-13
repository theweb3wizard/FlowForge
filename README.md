# FlowForge 🌊 — No-Code Smart Contract Deployments for BlockDAG

**Visit the live FlowForge dApp:** **[https://flowforgehq.netlify.app/](https://flowforgehq.netlify.app/)**

**FlowForge is a no-code toolkit that empowers developers, DAOs, and builders to deploy and interact with secure, pre-audited smart contracts on the BlockDAG testnet without writing a single line of Solidity.**

> Our mission is to accelerate the growth of the BlockDAG ecosystem by transforming complex contract management into a simple, fast, and secure visual workflow.

---

## ✅ Wave 3 Complete: On-Chain Contract Interaction

FlowForge has evolved from a simple deployment tool into an interactive dApp management platform. We have successfully achieved our Wave 3 milestone: **allowing users to directly interact with their deployed smart contracts from the UI.**

| Feature                        | Status           | Description                                                                                               |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Live Contract Deployment**   | ✅ Completed     | Deploy a real ERC-20 token contract directly to the BlockDAG testnet.                                     |
| **Persistent History**         | ✅ Completed     | Deployment records are saved to Supabase and displayed on a public dashboard.                             |
| **Dynamic Interaction UI**     | ✅ **Completed** | **A new page dynamically generates Read/Write forms for every function in a contract's ABI.**             |
| **Direct On-Chain Interaction**| ✅ **Completed** | **Users can now call contract functions, sign transactions, and view state directly from the dApp.**        |
| **Developer Experience**       | ✅ **Completed** | **Added a "Copy ABI" button for seamless integration with other developer tools.**                          |
| **UI/UX Polish**               | ✅ **Completed** | **Implemented a full Light & Dark mode theme for a professional and accessible user experience.**           |

---

## 🏗️ Architecture Overview

FlowForge is built on a modern web stack designed for a seamless, resilient, and scalable user experience. Wave 3 added a powerful new interaction layer.

```
[User's Browser]
      |
      +-----> [Next.js Frontend (React, wagmi)]
      |         - (1) Deploys ERC-20 contract.
      |         - (2) Navigates to Dashboard -> Clicks on deployed contract.
      |
      +-----> [Contract Interaction Page]
      |         - (3) Dynamically generates forms for `balanceOf`, `transfer`, etc., from ABI.
      |         - (4) User calls `balanceOf(0x...)` -> Reads data from BlockDAG.
      |
      +-----> [MetaMask]
      |         - (5) User calls `transfer(...)` -> Signs transaction.
      |
      +-----> [BlockDAG Testnet]
                - (6) Confirms transaction, state is updated.
      |
[FlowForge Backend]
      |
      +-----> [Supabase Client]
                - (7) Stores initial deployment record.
```

### Tech Stack

| Layer                | Technology                                      | Purpose                               |
| -------------------- | ----------------------------------------------- | ------------------------------------- |
| **Frontend**         | Next.js (App Router) + TypeScript               | Application Framework & UI            |
| **Styling**          | TailwindCSS + ShadCN UI + **next-themes**       | Modern, **Theme-Aware** Design System |
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

## 🗺️ Project Roadmap: Wave 4 and Beyond

Our focus for Wave 4 is to solve the single biggest bottleneck in the platform: **the manual process of adding new contract templates.** The goal is to transform FlowForge into a truly dynamic, scalable, no-code platform.

| Phase  | Core Deliverable                                     | Status       |
| ------ | ---------------------------------------------------- | ------------ |
| **Wave 1** | UI Scaffold & Mocked Backend                       | ✅ Completed |
| **Wave 2** | Real ERC-20 Deployment to BlockDAG Testnet         | ✅ Completed |
| **Wave 3** | **Dynamic On-Chain Contract Interaction UI**       | ✅ **Completed** |
| **Wave 4** | **Supabase-Driven Templates & AI Onboarding**      | 🚀 Planned   |

Our priorities for Wave 4 are clear and transformative:

-   **Database-Driven Templates:** We will migrate all contract templates from hardcoded files into a **Supabase database table.** The application will fetch available templates dynamically, making the platform instantly extensible without new code deployments.

-   **AI-Powered Contract Onboarding:** We will build an internal admin tool that uses a Genkit AI flow to automate the addition of new contracts. An admin will simply paste raw Solidity code, and the AI will:
    1.  Analyze the code to extract the description and constructor parameters.
    2.  Compile the code to get the ABI and Bytecode.
    3.  Save the complete, structured template directly into the Supabase database.

-   **Fully Dynamic Deployment & Interaction:** By using the template data from Supabase, the deployment wizard and interaction pages will become 100% dynamic, able to handle any contract type without requiring manual code changes.

This new architecture will finally deliver on the promise of FlowForge: a truly no-code, scalable platform for the entire BlockDAG ecosystem.
