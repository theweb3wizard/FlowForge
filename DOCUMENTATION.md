# FlowForge — Technical Documentation

**Version:** 3.0 (Wave 3 Submission)
**Author:** The Web3 Wizard (Khalid)

---

## 1. Overview

This document provides a technical overview of the FlowForge dApp as submitted for Wave 3 of the BlockDAG Buildathon. This phase focused on deepening the user experience by moving beyond simple deployment to **enabling direct, on-chain interaction with deployed smart contracts.**

The primary goal of this phase was to build a robust post-deployment experience, allowing users to read contract state and execute functions directly from the UI. We also polished the user interface by implementing a professional light/dark mode theme and made key developer experience improvements.

### 1.1. Wave 2 Achievements Recap

- **Live On-Chain Deployment:** Users can successfully deploy a pre-audited ERC-20 smart contract to the BlockDAG testnet.
- **Network Resilience:** Implemented robust solutions for BlockDAG-specific network issues, including RPC CORS errors, faulty gas estimation, and slow block confirmation times.
- **Persistent Deployment History:** All successful deployments are recorded in a Supabase database and displayed on a public dashboard.

### 1.2. Wave 3 Achievements: From Deployment to Interaction

- **Dynamic Contract Interaction Page:** A new, dedicated page (`/dashboard/contract/[address]`) is automatically generated for every deployed contract. This page reads the contract's ABI and dynamically generates forms for all `read` and `write` functions, allowing users to query data or execute transactions on-chain.
- **Developer-Focused Tooling:** Added a "Copy ABI" feature on the dashboard and interaction page, allowing developers to easily grab the contract's ABI for use in other tools, scripts, or dApps.
- **Professional UI/UX Polish:** Implemented a full light and dark mode theme using `next-themes` and `shadcn/ui`. The application now respects system preferences and allows users to toggle themes, providing a more professional and accessible user experience.
- **Architectural Discovery:** Identified critical scalability limitations in the current static template system, leading to a refined and more robust architectural plan for Wave 4.

---

## 2. System Architecture & Wave 3 Enhancements

The core architecture remains a decoupled Next.js frontend, a Next.js backend for RPC proxying, and a Supabase data layer. Wave 3 extended this architecture with a powerful new interaction layer.

### 2.1. End-to-End Interaction Flow

1.  **Contract Selection:** A user navigates to the Dashboard and selects a previously deployed contract.
2.  **Dynamic Page Generation:** The user is taken to `/dashboard/contract/<contract_address>`.
3.  **ABI Parsing:** The page component (`ContractInteractionPanel.tsx`) retrieves the contract's ABI (currently hardcoded for ERC-20, a key area for improvement in Wave 4).
4.  **Form Generation:** A utility (`abi-utils.ts`) parses the ABI, separating functions into `read` (view/pure) and `write` (nonpayable/payable) categories. React Hook Form and Zod are used to dynamically generate a validated form for each function, including inputs for its parameters.
5.  **On-Chain Read:** For `read` functions, the `usePublicClient` from `wagmi` is used to make a gas-less `readContract` call to the BlockDAG network. The formatted result is displayed to the user.
6.  **On-Chain Write:** For `write` functions, the component uses the `useWalletClient` from `wagmi`. It prompts the user to sign a transaction with their connected wallet, which is then sent to the network. The UI provides feedback on the transaction status.

### 2.2. Core Technology Stack (Wave 3 Additions)

| Layer                 | Technology                                      | Purpose                                                                |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| **Application Framework** | Next.js (App Router) + TypeScript               | Handles frontend rendering and backend RPC proxying.                   |
| **Styling**           | TailwindCSS + ShadCN UI + **next-themes**       | Provides a modern, **theme-aware** component-based design system.      |
| **Wallet & Blockchain** | `wagmi` + `viem`                                  | Manages wallet state and constructs/sends transactions.                |
| **Data Layer**        | Supabase (Postgres)                             | Stores a persistent registry of all deployments.                       |
| **Target Blockchain** | BlockDAG Testnet                                  | The core deployment target for all smart contracts.                    |
| **Form Management**   | **React Hook Form + Zod**                       | For dynamic, type-safe generation of contract interaction forms.       |

---

## 3. Wave 3 Challenges & Solutions

The primary challenge in Wave 3 was not a technical bug but an **architectural realization**.

-   **Problem: The Static Template Bottleneck.** While attempting to add more contract templates (e.g., ERC-721, Multi-Sig), it became painfully clear that the existing architecture was not scalable. Every new contract required:
    1.  Manual compilation of Solidity to get ABI and Bytecode.
    2.  Creating new files in `src/lib/abis/`.
    3.  Manually adding the template definition to `src/lib/contracts.ts`.
    4.  Adding hardcoded `if/else` logic to `DeploymentWizard.tsx` to handle the new contract's specific parameters.
    This process was slow, error-prone, and completely defeated the "no-code" vision of FlowForge. It was a developer-dependent workflow that could not scale.

-   **Solution: A New Architectural Vision (The Wave 4 Roadmap).** We diagnosed this as a fundamental architectural flaw. The solution is to move from a static, file-based template system to a **dynamic, database-driven one.** Instead of hardcoding templates into the application, they will be stored as content in a Supabase table. This insight, born from the struggles of Wave 3, directly informs and validates the entire roadmap for Wave 4.

---

## 4. Project Structure & Setup

*(Setup instructions remain the same as Wave 2, as the core infrastructure has not changed.)*

### 4.1. Key File Locations (Wave 3 Additions)

| File/Folder                               | Description                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/dashboard/contract/[address]/`     | **[New]** Dynamic page for interacting with a deployed contract.                                              |
| `src/components/contract/`                  | **[New]** Contains `ContractInteractionPanel.tsx` and `FunctionForm.tsx` for on-chain interactions.         |
| `src/components/common/ThemeProvider.tsx`   | **[New]** The provider for enabling light and dark mode functionality.                                        |
| `src/lib/abi-utils.ts`                      | **[New]** Utility functions for parsing ABIs and formatting results.                                          |
| `src/lib/contracts.ts`                    | Defines the metadata for contract templates. **(Identified as a bottleneck).**                                  |
| `src/lib/wagmi.ts`                        | Configuration for `wagmi`, defining the BlockDAG chain and RPC transport.                                       |
| `next.config.js`                          | Contains the `rewrites` rule for the RPC proxy.                                                               |

### 4.2. Local Development Setup

*(No changes from Wave 2)*

1.  **Clone, install dependencies, configure `.env.local`, set up the Supabase `deployments` table, and run the app.** (Refer to Wave 2 documentation for full details).

---

## 5. Wave 4 Roadmap: The Dynamic Platform

The insights from Wave 3 have provided a crystal-clear vision for Wave 4. The goal is to rebuild FlowForge's foundation to be truly dynamic and scalable, eliminating the static template bottleneck.

-   **Supabase-Driven Contract Library:**
    -   Create a new `contract_templates` table in Supabase to store all information about a contract: name, description, ABI, bytecode, and constructor parameters (as a JSON field).
    -   Refactor the homepage to fetch all available templates directly from this Supabase table, removing the hardcoded `contracts.ts` file entirely.

-   **AI-Powered Contract Onboarding:**
    -   Build an admin-only interface where new smart contracts can be added simply by **pasting the raw Solidity code.**
    -   Create a suite of Genkit AI flows that will automatically:
        1.  Analyze the Solidity code to extract the contract name, description, and constructor parameters.
        2.  Compile the code on the server to generate the ABI and bytecode.
        3.  Save this complete, structured package as a new entry in the `contract_templates` table in Supabase.

-   **Fully Dynamic Deployment Wizard:**
    -   Re-engineer the `DeploymentWizard.tsx` component to be completely dynamic. It will read the parameters from the selected Supabase template and generate the deployment form on the fly, without any `if/else` logic for specific contract types.

-   **Expand Template Library (The Right Way):**
    -   Once the new architecture is in place, we will rapidly expand the library by onboarding ERC-721 (NFT), Vesting, and Multi-Sig wallet templates *using our own AI-powered admin UI*. This will be the ultimate validation of the new, scalable system.
