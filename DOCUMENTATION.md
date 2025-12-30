# FlowForge — Technical Documentation

**Version:** 4.0 (Wave 4 Submission)
**Author:** The Web3 Wizard (Khalid)

---

## 1. Overview

This document provides a technical overview of the FlowForge dApp as submitted for Wave 4 of the BlockDAG Buildathon. This phase represents a fundamental architectural shift, transforming FlowForge from a single-contract deployment tool into a **powerful workflow orchestration platform** capable of managing complex, multi-step smart contract deployments and interactions.

### 1.1. Core Philosophy: Responding to Wave 3 Feedback

The feedback from Wave 3 was a clear directive: "figure out more functionalities and how you can bring some Account Abstraction (AA) features."

Instead of implementing a simple gasless transaction feature, we took a deeper approach to Account Abstraction. AA is fundamentally about abstracting away the complexities of the underlying blockchain protocol. While gas is one complexity, we identified a far greater pain point for developers: **procedural complexity**.

Wave 4 directly addresses this by introducing **Recipes**—a powerful form of **Workflow Abstraction**. We've abstracted the entire multi-step, multi-transaction process of deploying an interconnected system of smart contracts into a single, programmable, and reusable developer intent.

### 1.2. Wave 4 Key Achievements

-   **Database-Driven Contract Library:** The old, hardcoded template system has been completely removed. All contract templates are now fetched dynamically from a Supabase database, making the platform scalable and easy to update.
-   **Enhanced ABI Engine:** The interaction engine has been upgraded to handle more complex data types, paving the way for supporting a wider variety of real-world contracts.
-   **Batch Deployment UI:** A "Batch Cart" system has been implemented, allowing users to queue up multiple contracts for sequential deployment. This forms the UI foundation for the Recipes system.
-   **Recipes (Workflow Abstraction):** The flagship feature of Wave 4. Recipes allow users to define, execute, and reuse dependent deployment and interaction sequences, effectively creating a single, logical "meta-transaction" from a series of individual ones.

---

## 2. Recipes: A Practical Form of Account Abstraction

### 2.1. What are Recipes? (The Restaurant Analogy)

Imagine you run a restaurant and want to make a multi-course meal:

-   **Without a Recipe (Standard EOA):** You make the appetizer, wait for it to finish, then make the main course, wait again, and finally make dessert. Every time a customer orders, you repeat all these manual steps.
-   **With a Recipe (FlowForge):** You write down the steps ONCE. Every time a customer orders, you just follow the recipe. Everything happens in the right order automatically.

FlowForge Recipes do the same thing for smart contract systems. They bundle a series of on-chain actions into a single, deterministic workflow.

### 2.2. Real-World Example: Launching a Token Project

Let's say you're launching a cryptocurrency project. You need to:
1.  **Deploy a Token Contract** (e.g., "MyToken", "MTK").
2.  **Deploy a Staking Contract** that needs the token's address from Step 1.
3.  **Grant Permission** by calling `setMinter(stakingAddress)` on the Token contract.
4.  **Transfer Ownership** of the Token contract to a secure multi-signature wallet.

#### Without Recipes (The Hard Way):
1.  Go to FlowForge, find the ERC-20 template, deploy it.
2.  Wait for confirmation, then manually copy the new token address (`0xABC123...`).
3.  Go back, find a Staking template, and manually paste the token address during deployment.
4.  Wait, then copy the new staking address (`0xDEF456...`).
5.  Go to the Token's interaction page, find `setMinter`, and paste the staking address. Execute the transaction.
6.  Go back to the Token's interaction page, find `transferOwnership`, paste your multi-sig address, and execute.
This is slow, tedious, and extremely prone to copy/paste errors.

#### With Recipes (The Smart Way):
1.  **Create a Recipe once:**
    *   **Step 1:** Add "Deploy Token" and configure its parameters.
    *   **Step 2:** Add "Deploy Staking" and for its `tokenAddress` parameter, use a variable: `${step1.contractAddress}`.
    *   **Step 3:** Add "Interact: Token" to call `setMinter`, using `${step2.contractAddress}` as the input.
    *   **Step 4:** Add "Interact: Token" to call `transferOwnership`.
2.  **Run the Recipe:** Click "Run". Confirm the four transactions in your wallet as they appear.

FlowForge handles the dependencies, waits for confirmations, and passes the output of one step as the input to the next, automatically.

### 2.3. Core Technical Capabilities of Recipes

1.  **Sequential Execution:** Recipes run steps one after another, waiting for on-chain confirmation before proceeding. This is critical for dependent deployments.
2.  **Variable Passing:** Recipes can automatically use outputs from previous steps (like a `contractAddress`) as inputs for subsequent steps. This eliminates manual data transfer and errors.
3.  **Mixed Actions:** Recipes can seamlessly combine **deploy actions** (creating new contracts) and **interact actions** (calling functions on existing contracts) in a single workflow.
4.  **Reusability & Idempotency:** A recipe is a reusable blueprint. It can be run on a testnet for thorough testing and then executed on mainnet with confidence.

### 2.4. Why Recipes Matter for FlowForge

-   **For Users:** It saves enormous amounts of time, prevents costly errors, and enables seamless team collaboration by sharing a single source of truth for deployment procedures. A recipe *is* living documentation.
-   **For the Platform:** It's a key differentiator. While other tools offer deployment or interaction, FlowForge offers **workflow orchestration**. This creates "product gravity," making the platform more valuable and indispensable the more users build and share recipes.

---

## 3. System Architecture & Wave 4 Enhancements

The architecture now revolves around a dynamic, database-first model.

### 3.1. End-to-End Deployment Flow (Single Contract)

1.  **Fetch Templates:** The homepage (`src/app/page.tsx`) calls `getActiveTemplates` in `src/lib/supabase/templates.ts` to fetch all available contracts from the `contract_templates` table in Supabase.
2.  **Open Modal:** The user selects a template, opening `DeploymentModal.tsx`.
3.  **Generate Form:** The `ConstructorForm.tsx` component parses the template's ABI and dynamically generates the input form. This now includes better support for a wider range of data types.
4.  **Deploy & Confirm:** The `useDeployContract.ts` hook manages the entire on-chain deployment, providing real-time status updates to the UI and waiting for confirmation.
5.  **Save Record:** Upon success, `createDeployment` in `src/lib/supabase/deployments.ts` saves a record to the `deployments` table.

### 3.2. Batch Deployment & Recipe Execution Flow

1.  **Add to Cart:** Users add templates to a batch using the UI, which is managed by `BatchContext.tsx`.
2.  **Configure Batch:** The `BatchCart.tsx` component provides a sheet where users configure all parameters for the queued contracts.
3.  **Execute Batch:** The `useBatchDeploy.ts` hook orchestrates the sequential deployment. It iterates through each item, calling `deploySingleContract` and waiting for its completion before starting the next.
4.  **Real-time Progress:** The `BatchProgressModal.tsx` listens to the hook's state (`currentDeployingIndex`, success/failure status) and provides detailed, real-time feedback to the user for each step.

---

## 4. Project Structure & Key Files

| File/Folder                             | Description                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/contexts/BatchContext.tsx`         | **[New]** Manages the state of the batch deployment cart (adding, removing, updating items).                  |
| `src/hooks/useBatchDeploy.ts`           | **[New]** The core orchestration logic for executing sequential deployments in a batch.                       |
| `src/components/batch/`                 | **[New]** Contains all UI components for the batching feature (`BatchCart.tsx`, `BatchProgressModal.tsx`).      |
| `src/lib/supabase/templates.ts`         | **[Updated]** Now the single source of truth for fetching contract templates from the database.                 |
| `src/lib/abi/parser.ts`                 | **[Updated]** Enhanced with better logic to handle more diverse ABI structures.                               |
| `src/app/dashboard/contract/[address]/` | Dynamic page for interacting with a deployed contract.                                                       |
| `src/hooks/useDeployContract.ts`        | The robust hook for deploying a single contract and tracking its on-chain status.                             |

---

## 5. Future Work (Post-Wave 4)

With the core orchestration engine now built, the next logical steps are to enhance the Recipe system and user experience.

-   **Recipe Saving & Sharing:** Allow users to save their configured batches as named "Recipes" in the database, which they can run again later or share with teammates.
-   **Add "Interact" Steps to Recipes:** Extend the recipe engine to allow users to add function calls (`setMinter`, `approve`, etc.) as steps in their workflow, not just deployments.
-   **AI-Powered Recipe Generation:** Build an interface where a user can describe a desired outcome in natural language (e.g., "I want to launch a token and a vesting contract for my team"), and an AI flow generates the corresponding recipe automatically.
-   **Event Log Viewer:** Add a UI on the contract interaction page to display and filter events emitted by the contract, providing crucial debugging information.
-   **Gas Estimation:** Before deployment, estimate the gas cost for the transaction and display it to the user.