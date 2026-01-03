# FlowForge - Smart Contract Orchestration Platform

FlowForge is a high-efficiency platform for deploying and orchestrating interconnected smart contract systems on BlockDAG and other EVM-compatible networks. It transforms complex, multi-step deployment procedures into simple, repeatable, and secure workflows.

This platform is designed for developers who want to move faster, reduce human error, and manage complex on-chain systems with confidence.

---

## ✅ Key Features

-   **🗂️ Unified Template System**: Manage a public library of pre-audited contracts alongside your own private, user-created templates.
-   **🚀 One-Click Deployment**: Deploy single contracts with a simple, auto-generated UI based on the contract's ABI.
-   **✨ Batch Deployment**: Queue up multiple contracts and deploy them all in a single, sequential transaction flow.
-   **📜 Recipe Orchestration**: The flagship feature. Define, save, and execute multi-step deployment and interaction sequences (e.g., "Deploy Token," then "Deploy Staking Contract using Token Address," then "Set Minter"). Recipes automate complex setups and eliminate manual copy/paste errors.
-   **🔐 Secure & Multi-User**: Built from the ground up with Row Level Security (RLS), ensuring each user's private templates and recipes are completely isolated and secure.
-   **📊 Real-Time Dashboard**: Track your personal and all public deployments in real-time with a live-updating dashboard.
-   **🌐 Multi-Network Support**: Seamlessly switch between the BlockDAG testnet, local development networks (like Hardhat), and other EVM chains.

---

## 🛠️ Technology Stack

FlowForge is built on a modern, robust, and scalable technology stack chosen for performance and developer experience.

| Layer                | Technology                               | Version   | Purpose                                                                                |
| -------------------- | ---------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| Frontend Framework   | [Next.js](https://nextjs.org/)           | `~15.3.8` | Provides a performant, server-first React framework with App Router for clean routing. |
| UI Components        | [shadcn/ui](https://ui.shadcn.com/)      | `N/A`     | Offers a library of beautiful, accessible, and themeable components.                   |
| Styling              | [Tailwind CSS](https://tailwindcss.com/) | `~3.4.1`  | Enables rapid, utility-first styling for a consistent design system.                   |
| State Management     | [TanStack Query](https://tanstack.com/query/latest) | `~5.51.1` | Manages server state, caching, and data fetching, eliminating stale data and race conditions. |
| Database             | [Supabase (PostgreSQL)](https://supabase.com/) | `~2.43.5` | Provides a scalable PostgreSQL backend with real-time capabilities and auth.         |
| Blockchain Network   | BlockDAG                                 | `Testnet` | The primary deployment target network.                                                   |
| Wallet Integration   | [wagmi](https://wagmi.sh/)               | `~2.10.10`| A robust React hook library for Ethereum wallet interaction.                           |
| Form Management      | [React Hook Form](https://react-hook-form.com/) | `~7.54.2` | Delivers high-performance, flexible, and scalable form validation and state management. |

---

## 🚀 Getting Started

### Prerequisites

-   Node.js `18.x` or higher
-   npm (or yarn/pnpm)
-   A Web3 wallet (e.g., MetaMask)
-   A Supabase account

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/theweb3wizard/FlowForge.git
    cd FlowForge
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file by copying the example file.
    ```bash
    cp .env.example .env.local
    ```
    Now, edit `.env.local` with your Supabase project URL and `anon` key. You will also need to get a `SUPABASE_JWT_SECRET` from your Supabase project's API settings (under "JWT Settings").

    ```env
    # Supabase connection
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET

    # BlockDAG network (or other EVM network)
    NEXT_PUBLIC_BLOCKDAG_RPC_URL=YOUR_RPC_URL
    NEXT_PUBLIC_BLOCKDAG_CHAIN_ID=1043
    NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL=YOUR_EXPLORER_URL
    ```

4.  **Set up the database:**
    Navigate to the **SQL Editor** in your Supabase dashboard and run the SQL scripts found in `src/DOCUMENTATION.md` under the "Database Setup" section. This will create all necessary tables, views, and security policies.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open your browser** to [http://localhost:9002](http://localhost:9002) and start building!

---

## 🏗️ Project Structure

The codebase is organized with a clear separation of concerns, making it easy to navigate and extend.

```
/src
  /app                  # Next.js App Router: Pages and layouts.
  /components           # Reusable React components.
    /common             # Shared components (Header, Footer, etc.).
    /dashboard          # Components for the deployment dashboard.
    /deployment         # Components for the contract deployment modal.
    /recipes            # Components for creating and running recipes.
    /templates          # Components for creating and displaying templates.
    /ui                 # Base UI components from shadcn/ui.
  /contexts             # React contexts (Wallet, Batch Deployment).
  /hooks                # Custom React hooks for business logic.
  /lib                  # Core application logic and utilities.
    /abi                # ABI parsing and processing utilities.
    /recipes            # Recipe execution engine.
    /supabase           # Supabase client and data access functions.
    /web3               # Blockchain interaction services.
  /types                # TypeScript type definitions.
```

For a complete technical overview, including architecture, database schema, and security policies, please refer to the [**Technical Documentation (`src/DOCUMENTATION.md`)**](./src/DOCUMENTATION.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow the standard workflow:

1.  **Fork the repository.**
2.  **Create a feature branch:** `git checkout -b feat/my-new-feature`.
3.  **Commit your changes:** `git commit -m 'feat: Add some amazing feature'`.
4.  **Push to the branch:** `git push origin feat/my-new-feature`.
5.  **Open a Pull Request.**

Please ensure your code adheres to the existing style and all new features are documented.
