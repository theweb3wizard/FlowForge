<p align="center">
  <img src="public/favicon.svg" alt="FlowForge Logo" width="64" height="64" />
</p>

<h1 align="center">FlowForge</h1>

<p align="center">
  <strong>AI-powered Solidity playground + GUI-first smart contract deployment workflow builder for any EVM chain.</strong><br/>
  Describe your contract in plain English. AI generates, compiles, and helps you deploy — all in your browser.
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://wagmi.sh"><img src="https://img.shields.io/badge/wagmi-v2-blue?logo=ethereum" alt="wagmi" /></a>
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql" alt="Neon" /></a>
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle" alt="Drizzle" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/status-beta-amber" alt="Beta" />
</p>

---

## What is FlowForge?

FlowForge is a **browser-based smart contract development environment** with two core capabilities:

- **Playground** — Describe your contract in plain English. AI generates production-ready Solidity (ERC20, ERC721, Multisig, Staking, etc.) using a curated pattern library. Compile live via solc-js, audit for security issues, deploy to 9 EVM chains, and interact with deployed contracts — all without leaving your browser.
- **Recipe Builder** — Chain multi-step deployment workflows together. Deploy a token in step 1, a staking pool in step 2 that references the token's address, grant roles in step 3 — all one click per step.

---

## Features

### AI-Powered Playground

| Feature | Description |
|---------|-------------|
| **AI Code Generation** | Describe your contract in English — AI generates production-ready Solidity with OpenZeppelin imports, NatSpec, and gas notes |
| **Pattern Library (RAG)** | 12+ verified contract templates (ERC20, ERC721, Multisig, Staking, Vesting, ERC1155, Timelock, Clone Factory, Crowdsale, DAO/Voting, Lending Pool, Payment Splitter). The AI retrieves the best-matching templates as few-shot examples for higher quality output |
| **Live Compilation** | Server-side solc-js compiles on every keystroke (debounced 1.2s). Imports from `@openzeppelin/contracts` resolved automatically from `node_modules` |
| **AI Compile-Fix Loop** | If compilation fails, the AI auto-fixes errors (up to 3 attempts) and re-streams corrected code |
| **Security Audit** | AI-powered vulnerability scanner flags reentrancy, access control issues, and more |
| **Contract Interaction** | Enter any verified contract address — auto-fetches ABI from block explorers (Etherscan, Basescan, Polygonscan, etc.) or load a local ABI JSON file. Read/write functions with a connected wallet |
| **One-Click Deploy** | Deploy contracts to any of 9 supported chains directly from the playground. Chain-specific gas estimation |

### Recipe Builder (Multi-Step Workflows)

- **Visual two-panel editor** — Left: ordered step list with drag-and-drop. Right: full configuration form for each step
- **Variable Passing** — Each step's parameters can reference `step_N.contractAddress` or `step_N.txHash` from any earlier step. Zero copy/paste
- **Deploy + Interact steps** — Mix contract deployments and function calls in the same workflow
- **9 EVM chains** — Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, BlockDAG Mainnet
- **Execution engine** — Each step result persisted to the database the moment it completes. Partial failure recovery — resume from the failed step
- **Execution history** — Full table of past runs per recipe. Step-by-step breakdown

### For Teams

- **Share recipes** — Toggle a recipe public to get a shareable URL. Anyone can view and clone it
- **Starter templates** — 6 pre-built workflow templates: ERC-20 + Staking, NFT Collection, DAO (Token + Timelock + Governor), Proxy Factory, Vesting, and more
- **Public recipe view** — Read-only page accessible without authentication

### For Builders

- **Dark + Light premium UI** — Built for developers. Warm industrial palette with light/dark mode toggle. Instrument Sans + Plus Jakarta Sans typography
- **No wallet lock-in** — Works with MetaMask, Phantom (EVM mode), Rabby, and any injected wallet
- **100% Free & Open Source** — No paywalls, no limits. MIT licensed

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 16** (App Router) | Server Components + Client Components. Turbopack for HMR |
| Language | **TypeScript 5** (strict) | Full type safety with strict mode |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first CSS. Light + dark themes via CSS variables |
| Builder state | **Zustand** | Flat, minimal store for recipe builder UI |
| Server state | **TanStack Query v5** | Auto-caching, background refetch |
| Database | **Neon (Serverless Postgres)** | Scale-to-zero, branching, connection pooling |
| ORM | **Drizzle** | Type-safe queries, schema-first, lightweight |
| Auth | **Neon Auth** (Better Auth) | Cookie-based sessions, wallet address as identity |
| Wallet | **wagmi v2 + viem** | Type-safe EVM interactions. No ethers.js |
| AI | **OpenRouter** (free-tier models) | Sequential fallback across free models (DeepSeek, Gemini, Mistral, Llama). 500ms backoff, 45s timeout |
| Compiler | **solc-js** (server-side) | No WASM download in browser. OZ imports resolved from `node_modules` |
| Editor | **Monaco Editor** | Dynamic import, `flowforge-dark` theme, no SSR |
| Payments | **None** | Completely free and open source |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                          │
│                                                                   │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│  │    Playground (Monaco)   │   │    Recipe Builder             │  │
│  │                         │   │    (Zustand store)            │  │
│  │  - Code Editor          │   │                              │  │
│  │  - AI Prompt Panel      │   │  - Step list                 │  │
│  │  - Compile Console      │   │  - ABI/param config          │  │
│  │  - Interact Panel       │   │  - Variable refs             │  │
│  │  - Deploy Panel         │   └──────────────────────────────┘  │
│  └─────────┬───────────────┘                                      │
│            │                                                       │
│            ▼                                                       │
│  ┌────────────────────────────────────────────────────────┐       │
│  │              API Routes (Next.js)                       │       │
│  │                                                         │       │
│  │  /api/generate → OpenRouter + compile-fix loop          │       │
│  │  /api/compile  → solc-js (server-side)                  │       │
│  │  /api/audit    → AI security analysis                   │       │
│  │  /api/explain  → AI code explanation                    │       │
│  └────────────────────────┬───────────────────────────────┘       │
│                           │                                        │
│  ┌────────────────────────▼───────────────────────────────┐       │
│  │  Execution Engine (useRecipeExecution hook)             │       │
│  │  ┌────────────────────────────────────────────────────┐│       │
│  │  │  For each step:                                    ││       │
│  │  │  1. Resolve params (replace variable refs)         ││       │
│  │  │  2. deployContractAsync / writeContractAsync        ││       │
│  │  │  3. Wait for receipt (Promise.race with timeout)   ││       │
│  │  │  4. Persist result to DB (per-step)                ││       │
│  │  └────────────────────────────────────────────────────┘│       │
│  └────────────────────────┬───────────────────────────────┘       │
│                           │                                        │
│  ┌────────────────────────▼───────────────────────────────┐       │
│  │  wagmi v2 (wallet layer — signs transactions)           │       │
│  └────────────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                              ▼
┌────────────────────────┐  ┌──────────────────────────────┐
│   EVM Network           │  │   Neon Postgres (via Drizzle) │
│   (user's wallet        │  │                               │
│    RPC endpoint)        │  │  recipes, recipe_steps        │
│                         │  │  executions (step_results[])  │
│  Sepolia / Base /       │  │  deployments                  │
│  Mainnet / etc.         │  │  generation_log (AI quota)    │
└────────────────────────┘  │                               │
                            │  Auth: Neon Auth (cookies)    │
                            └──────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A browser wallet (MetaMask, Phantom, Rabby)
- A free [Neon](https://neon.tech) account (includes a free Postgres instance)
- An [OpenRouter API key](https://openrouter.ai/keys) (free tier)
- Sepolia ETH for testing

### 1. Clone and install

```bash
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Neon database URL and auth credentials (found in your Neon project dashboard).

### 3. Push the database schema

```bash
npx drizzle-kit push
```

This creates all tables (recipes, recipe_steps, executions, deployments, generation_log) in your Neon Postgres database.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002).

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated routes
│   │   ├── dashboard/            # My Recipes
│   │   └── recipe/[id]/
│   │       ├── builder/          # Recipe Builder (core UI)
│   │       ├── run/              # Chain selector + execution
│   │       └── history/          # Execution history
│   ├── (auth)/sign-in/           # Wallet sign-in
│   ├── api/
│   │   ├── generate/             # AI code generation + compile-fix loop
│   │   ├── compile/              # solc-js compilation (server-side)
│   │   ├── audit/                # AI security audit
│   │   ├── explain/              # AI code explanation
│   │   └── generate-recipe/      # AI recipe generation from description
│   ├── playground/               # Playground (CodeEditor, CompileConsole, etc.)
│   ├── recipe/shared/[id]/       # Public recipe view
│   ├── pricing/                  # Pricing page
│   ├── how-it-works/             # How It Works page
│   └── page.tsx                  # Landing page
├── components/
│   ├── playground/               # Playground UI components
│   ├── execution/                # Execution UI
│   ├── recipe/                   # RecipeCard, TemplateGallery
│   ├── pricing/                  # PricingCard
│   ├── common/                   # ConnectWalletButton, ThemeToggle
│   ├── layout/                   # AppNav, AppShell, Providers
│   ├── three/                    # 3D hero components
│   └── ui/                       # shadcn/ui primitives
├── lib/
│   ├── ai/                       # AI integration (OpenRouter, prompts, patterns)
│   ├── compiler/                 # solc-js wrapper
│   ├── db/                       # Drizzle schema, client, DAL (recipes, recipeSteps, executions)
│   ├── auth/                     # Neon Auth (server + client)
│   ├── actions/                  # Server Actions (recipeActions, executionActions)
│   ├── abi/                      # ABI parsing utilities
│   ├── env.ts                    # Zod env validation
│   └── utils.ts                  # cn() helper
├── hooks/
│   └── useRecipeExecution.ts     # Execution engine (AbortController, partial resume)
├── config/
│   ├── chains.ts                 # 9 supported chains
│   └── wagmi.ts                  # wagmi config
├── stores/
│   └── recipeBuilderStore.ts     # Zustand builder state
├── types/
│   └── ...                       # Shared TypeScript types
└── utils/
    └── ...                       # encodeStepArgs, formatExecutionError, etc.
```

---

## Database Schema

Managed via Drizzle ORM (`src/lib/db/schema.ts`). Five tables:

- **recipes** — User-defined deployment workflows
- **recipe_steps** — Ordered actions within a recipe (deploy or interact)
- **executions** — Per-run record with persisted step results
- **deployments** — Deployed contract tracking (playground deploys)
- **generation_log** — AI usage tracking

---

## Supported Chains

| Chain | Type | Chain ID |
|-------|------|----------|
| Ethereum Mainnet | Mainnet | 1 |
| Sepolia | Testnet | 11155111 |
| Base | Mainnet | 8453 |
| Base Sepolia | Testnet | 84532 |
| Polygon | Mainnet | 137 |
| Arbitrum One | Mainnet | 42161 |
| Optimism | Mainnet | 10 |
| BNB Smart Chain | Mainnet | 56 |
| BlockDAG Mainnet | Mainnet | 1043 |

---

## Security Notes

- **No private keys** — FlowForge never touches your private keys. All transactions signed by your wallet
- **Neon Auth sessions** — Cookie-based auth with server-side session validation
- **Server Actions authenticated** — All write operations verify the session server-side
- **Open source** — MIT licensed. Fully transparent codebase
- **Env validation** — `src/lib/env.ts` validates all required env vars at startup using Zod

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow code conventions — no `ethers.js`, no inline styles, prefer type safety
4. Commit: `git commit -m 'feat: description'`
5. Push and open a PR against `main`

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>Beta</strong> — Built by <a href="https://github.com/theweb3wizard">The Web3 Wizard (Khalid)</a> · For EVM developers who are done writing deployment scripts.
</p>
