# FlowForge — Wave 2 Technical Documentation

**Version:** 2.0 (Wave 2 Submission)
**Author:** The Web3 Wizard (Khalid)

---

## 1. Overview

This document provides a technical overview of the FlowForge dApp as submitted for Wave 2 of the BlockDAG Buildathon. The project has successfully transitioned from a UI prototype into a **functional dApp with live, on-chain smart contract deployment capabilities on the BlockDAG testnet.**

The primary goal of this phase was to solve the complex engineering challenges required to reliably interact with the BlockDAG network, proving the core value proposition of FlowForge. This document details our architecture, the problems we solved, and the system's end-to-end workflow.

### 1.1. Wave 2 Achievements

- **Live On-Chain Deployment:** Users can successfully deploy a pre-audited ERC-20 smart contract to the BlockDAG testnet.
- **Network Resilience:** Implemented robust solutions for BlockDAG-specific network issues, including RPC CORS errors, faulty gas estimation, and slow block confirmation times.
- **Complete User Journey:** The application supports the full end-to-end flow: wallet connection, parameter input, transaction signing, on-chain deployment, and post-deployment verification via explorer links.
- **Persistent Deployment History:** All successful deployments are recorded in a Supabase database, including the transaction hash and resulting contract address, and displayed on a public dashboard.
- **Polished User Experience:** The UI has been refined to guide users through the potentially long waiting period and clearly distinguishes between live and upcoming contract templates.

---

## 2. System Architecture & Data Flow

FlowForge uses a decoupled architecture designed for security, scalability, and a seamless user experience. The frontend is responsible for the UI and wallet interaction, the Next.js backend handles RPC proxying, and Supabase manages data persistence.

### 2.1. End-to-End Deployment Flow

1.  **Wallet Connection:** The user connects their MetaMask wallet to the dApp. The frontend uses `wagmi` to manage wallet state.
2.  **Template Selection & Parameter Input:** The user selects the "Standard Token (ERC-20)" template and fills out a form with parameters (e.g., token name, symbol, supply).
3.  **Transaction Initiation:** The user clicks "Deploy." The frontend constructs the deployment transaction using `viem`, combining the pre-compiled contract bytecode with the user's encoded parameters.
4.  **Transaction Signing:** The user is prompted by MetaMask to review and sign the transaction.
5.  **RPC Proxy & Submission:** The signed transaction is sent to our Next.js backend (`/api/rpc`), which forwards it to the official BlockDAG RPC endpoint. This proxy is critical to bypass browser-based CORS restrictions.
6.  **On-Chain Confirmation:** The application now polls the network for the transaction receipt. To handle BlockDAG's slow block times (2-5 minutes), the UI displays a dynamic progress bar and status updates, informing the user of the progress.
7.  **Data Persistence:** Upon successful confirmation, the deployment details (contract address, deployer address, transaction hash) are saved to the `deployments` table in our Supabase database.
8.  **User Feedback & Verification:** The user is shown a success screen with a direct link to view their contract creation transaction on the BlockDAG explorer. The new deployment also appears on the public dashboard.

### 2.2. Core Technology Stack

| Layer                | Technology                                      | Purpose                                                    |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| **Application Framework**| Next.js (App Router) + TypeScript               | Handles frontend rendering and backend RPC proxying.       |
| **Styling**          | TailwindCSS + ShadCN UI                         | Provides a modern, component-based design system.          |
| **Wallet & Blockchain**| `wagmi` + `viem`                                  | Manages wallet state and constructs/sends transactions.    |
| **Data Layer**       | Supabase (Postgres)                             | Stores a persistent registry of all deployments.           |
| **Target Blockchain**| BlockDAG Testnet                                  | The core deployment target for all smart contracts.        |

---

## 3. Network Issues & Solutions

A significant part of Wave 2 was engineering solutions to challenges specific to the BlockDAG testnet environment.

### 3.1. RPC CORS Failures

- **Problem:** Direct `fetch` requests from the browser to the BlockDAG RPC were blocked due to the browser's Cross-Origin Resource Sharing (CORS) policy.
- **Solution:** We implemented a backend proxy using a Next.js `rewrites` rule in `next.config.js`. All RPC requests from the client are directed to `/api/rpc`, which the Next.js server seamlessly forwards to the actual RPC endpoint. This server-to-server request is not subject to CORS, completely resolving the issue.

### 3.2. Gas Estimation Errors

- **Problem:** `viem`'s automatic gas estimation (`eth_estimateGas`) failed, returning `null` and preventing transactions from being sent. This indicates the BlockDAG RPC does not properly support this feature for contract deployments.
- **Solution:** We disabled automatic gas estimation and now provide **manual, hardcoded gas parameters** (`gas` limit and `gasPrice`) in the deployment transaction. This ensures the transaction is valid and can be processed by the network without relying on a faulty estimation call.

### 3.3. Slow Block Confirmation & Timeouts

- **Problem:** BlockDAG's testnet has confirmation times of 2-5 minutes. The default timeout in `viem` was causing the application to report a failure while the transaction was still valid but pending.
- **Solution:**
    1.  The `waitForTransactionReceipt` timeout was increased to 5 minutes (`300_000` ms) to patiently wait for confirmation.
    2.  The UI was enhanced with a dynamic progress bar and descriptive status messages (e.g., "Awaiting Final Confirmation...") to provide clear feedback and manage user expectations during the long wait.
    3.  Specific error handling was added to catch `TimeoutError`, informing the user that the network is congested and that their transaction may still succeed, providing the explorer link for manual verification.

---

## 4. Project Structure & Setup

### 4.1. Key File Locations

| File/Folder                  | Description                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/`                     | Core application pages (Home, Dashboard).                                                                     |
| `src/components/deployment/` | Contains the `DeploymentWizard.tsx` component, which handles the entire deployment UI and logic.              |
| `src/contexts/`                | React contexts for managing global state (Wallet connection, Deployments).                                  |
| `src/lib/abis/erc20.ts`      | Contains the pre-compiled `bytecode` and `abi` for the ERC-20 contract.                                       |
| `src/lib/contracts.ts`       | Defines the metadata and parameters for all contract templates available in the UI.                           |
| `src/lib/wagmi.ts`           | Configuration for `wagmi`, defining the BlockDAG chain and RPC transport.                                       |
| `next.config.js`             | Contains the `rewrites` rule for the RPC proxy.                                                               |
| `.env.local.example`         | Template for required environment variables.                                                                  |

### 4.2. Local Development Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/theweb3wizard/FlowForge.git
    cd FlowForge
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file and populate it with your Supabase credentials and the correct BlockDAG network information.
    ```bash
    # Get these from your Supabase Project -> Settings -> API
    NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-public-anon-key"

    # BlockDAG Network Configuration
    NEXT_PUBLIC_BLOCKDAG_RPC_URL="https://rpc.awakening.bdagscan.com/"
    NEXT_PUBLIC_BLOCKDAG_CHAIN_ID="11155111"
    NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL="https://testnet.bdagscan.com"
    ```

4.  **Set Up Supabase Table:**
    Run the following SQL in your Supabase project's SQL Editor to create and configure the `deployments` table.
    ```sql
    -- Create the 'deployments' table
    CREATE TABLE deployments (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      "contractName" TEXT NOT NULL,
      address TEXT NOT NULL,
      deployer TEXT NOT NULL,
      "timestamp" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      "transactionHash" TEXT
    );

    -- Enable Row Level Security (RLS)
    ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

    -- Allow public read access for the dashboard
    CREATE POLICY "Public read access" ON deployments
      FOR SELECT
      USING (true);

    -- Allow anonymous inserts (for buildathon simplicity)
    CREATE POLICY "Allow anonymous insert" ON deployments
      FOR INSERT
      WITH CHECK (true);
    ```

5.  **Run the Application:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

## 5. Wave 3 Roadmap

-   **Expand Template Library:** Implement audited templates for ERC-721 (NFTs), Token Vesting, and Multi-Sig Wallets.
-   **One-Click Contract Verification:** Add a feature to automatically verify the contract source code on the BlockDAG explorer after deployment.
-   **Deployment Analytics:** Introduce a dashboard for each deployed contract showing basic on-chain metrics.
-   **ContractGuardian (Exploration):** Begin research into an AI-powered service that performs a preliminary scan of contract code for common vulnerabilities.
