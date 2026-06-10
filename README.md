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
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" /></a>
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
- **Execution engine** — Each step result persisted to Supabase the moment it completes. Partial failure recovery — resume from the failed step
- **Execution history** — Full table of past runs per recipe. Step-by-step breakdown. CSV export

### For Teams

- **Share recipes** — Toggle a recipe public to get a shareable URL. Anyone can view and clone it
- **Starter templates** — 6 pre-built workflow templates: ERC-20 + Staking, NFT Collection, DAO (Token + Timelock + Governor), Proxy Factory, Vesting, and more
- **Public recipe view** — Read-only page accessible without authentication

### For Builders

- **Dark, premium UI** — Built for developers. Monospace fonts. Colour-coded states. FlowForge-dark Monaco theme
- **No wallet lock-in** — Works with MetaMask, Phantom (EVM mode), Rabby, and any injected wallet
- **100% Free & Open Source** — No paywalls, no limits. MIT licensed

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 16** (App Router) | Server Components + Client Components. Turbopack for HMR |
| Language | **TypeScript 5** (strict) | No `any`. Every type explicit |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first CSS. Dark-only theme via CSS variables |
| Builder state | **Zustand** | Flat, minimal store for recipe builder UI |
| Server state | **TanStack Query v5** | Auto-caching, background refetch for Supabase data |
| Database | **Supabase (PostgreSQL)** | RLS on all tables. Anonymous + wallet auth |
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
│  │  │  4. Persist result to Supabase (per-step)          ││       │
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
│   EVM Network           │  │   Supabase (PostgreSQL)       │
│   (user's wallet        │  │                               │
│    RPC endpoint)        │  │  recipes, recipe_steps        │
│                         │  │  executions (step_results[])  │
│  Sepolia / Base /       │  │  deployments                  │
│  Mainnet / etc.         │  │  generation_log (AI quota)    │
└────────────────────────┘  │                               │
                            │  RLS: users own their data    │
                            └──────────────────────────────┘
```

**Key design decisions:**
- **No backend RPC** — all on-chain calls go through the user's own wallet
- **Compile server-side** — solc-js runs in Next.js API routes (Node.js only), avoiding WASM download in browser
- **Pattern-library RAG over fine-tuning** — ~20 curated Solidity templates + keyword retriever (<100ms) injected as few-shot examples into the generation prompt. No model training required
- **Agentic compile-fix loop** — 3 attempts max. First compiles immediately, only feeds errors on subsequent attempts
- **AbortController in execution engine** — cancels in-flight transactions on user abort/wallet disconnect. All completed steps already persisted

---

## Database Schema

Updated with playground support:

```sql
-- Tables from v1
recipes (id, user_id, name, description, is_public, created_at, updated_at)
recipe_steps (id, recipe_id, step_order, step_type, label, abi, bytecode, ...)
executions (id, recipe_id, user_id, chain_id, status, step_results, ...)

-- New playground tables
deployments (
  id           uuid PRIMARY KEY,
  user_id      uuid REFERENCES auth.users,
  recipe_id    uuid REFERENCES recipes,     -- nullable — direct deploy from playground
  contract_address text NOT NULL,
  chain_id     integer NOT NULL,
  tx_hash      text NOT NULL,
  abi          jsonb,
  metadata     jsonb,
  created_at   timestamptz
)

generation_log (
  id           uuid PRIMARY KEY,
  user_id      uuid REFERENCES auth.users,
  prompt       text NOT NULL,
  model        text NOT NULL,
  tokens_in    integer,
  tokens_out   integer,
  created_at   timestamptz DEFAULT now()
)
```

RLS policies: users can CRUD their own data. Public recipes readable by anyone.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A browser wallet (MetaMask, Phantom, Rabby)
- A free [Supabase](https://supabase.com) account
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

Edit `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (required for AI features)
OPENROUTER_API_KEY=sk-or-v1-your-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 3. Apply the database schema

Run `database/schema.sql` and `database/migration-001-playground.sql` in your Supabase SQL Editor.

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
│   │   ├── AIPromptPanel.tsx     # AI prompt input + template selector
│   │   ├── CodeEditor.tsx        # Monaco Editor wrapper
│   │   ├── CompileConsole.tsx    # Compile output + audit results
│   │   ├── InteractPanel.tsx     # Contract interaction (read/write)
│   │   └── DeployPanel.tsx       # Deploy wizard (3-step)
│   ├── execution/                # Execution UI
│   ├── recipe/                   # RecipeCard, TemplateGallery
│   ├── pricing/                  # PricingCard
│   ├── common/                   # ConnectWalletButton
│   ├── layout/                   # AppNav, AppShell, Providers
│   └── three/                    # 3D hero components
├── lib/
│   ├── ai/                       # AI integration
│   │   ├── openrouter.ts         # OpenRouter client (fallback models)
│   │   ├── prompts.ts            # All system prompts (GENERATE, FIX, AUDIT, EXPLAIN, RECIPE)
│   │   └── patterns/             # Solidity pattern library (RAG)
│   │       ├── templates.ts      # 12+ verified contract templates
│   │       ├── retriever.ts      # Keyword-based pattern matcher
│   │       └── index.ts
│   ├── compiler/
│   │   └── solc.ts               # solc-js wrapper (OZ import resolution, Windows paths)
│   ├── supabase/                 # Typed client, server client, DAL
│   └── actions/
│       └── recipeActions.ts      # Server Actions
├── hooks/
│   └── useRecipeExecution.ts     # Execution engine (AbortController, partial resume)
├── config/
│   ├── chains.ts                 # 9 supported chains
│   └── wagmi.ts                  # wagmi config
├── types/
│   ├── playground.ts             # Playground types (CompileResult, SecurityFinding, etc.)
│   └── recipe.ts, execution.ts, chain.ts
└── utils/
    └── formatExecutionError.ts   # Human-readable error messages (9+ error types)
```

---

## Pattern Library

The AI code generator is backed by a curated library of verified Solidity contract templates. When you describe a contract, the system matches your prompt against template keywords and injects the best-matching templates as few-shot examples.

**Available templates:**
ERC-20, ERC-721, Multisig Wallet, Staking, Vesting, ERC-1155, Timelock Controller, Clone Factory, Crowdsale, DAO/Voting, Lending Pool, Payment Splitter

Adding a new template: add to `src/lib/ai/patterns/templates.ts` and update the keywords in the retriever. No embeddings, no API calls — pure keyword scoring in <100ms.

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
- **Row Level Security** — Every Supabase table has RLS enabled
- **Server Actions authenticated** — All write operations verify the Supabase session server-side
- **Open source** — MIT licensed. Fully transparent codebase
- **Env validation** — `src/lib/env.ts` validates all required env vars at startup using Zod

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow code conventions — no `any` types, no ethers.js, no inline styles
4. Commit: `git commit -m 'feat: description'`
5. Push and open a PR against `main`

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>Beta</strong> — Built by <a href="https://github.com/theweb3wizard">The Web3 Wizard (Khalid)</a> · For EVM developers who are done writing deployment scripts.
</p>
