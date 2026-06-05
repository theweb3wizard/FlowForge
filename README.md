<p align="center">
  <img src="public/favicon.svg" alt="FlowForge Logo" width="64" height="64" />
</p>

<h1 align="center">FlowForge</h1>

<p align="center">
  <strong>GUI-first smart contract deployment workflow builder for any EVM chain.</strong><br/>
  Define a deployment sequence once. Run it on any chain. Share it with your team.
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://wagmi.sh"><img src="https://img.shields.io/badge/wagmi-v2-blue?logo=ethereum" alt="wagmi" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## What is FlowForge?

Deploying a real DeFi protocol — a token, a staking contract, a governance system — means:

1. Deploying contract A, waiting for confirmation, copying its address
2. Pasting that address into contract B's constructor, deploying, waiting again
3. Calling a function on contract A *using* contract B's address
4. Doing this again every time you want to test on a new network

**FlowForge eliminates all of that.**

You define the sequence once as a **Recipe** — an ordered list of deployment and interaction steps where each step can reference the output (contract address, tx hash) of any previous step. Then you run it with one click on any of the 9 supported EVM chains. Your wallet signs each transaction. No scripts, no terminal, no local Node.js environment required.

> **Timing matters:** OpenZeppelin Defender — the tool 15,000+ developers used for deployment orchestration — shut down on July 1, 2026. FlowForge is the GUI-first alternative.

---

## Features

### For developers who ship protocols

- **Recipe Builder** — Visual two-panel editor. Left: ordered step list with drag-and-drop reorder. Right: full configuration form for each step (ABI upload, bytecode, constructor params, function selector).
- **Variable Passing** — Each step's parameters can reference `step_N.contractAddress` or `step_N.txHash` from any earlier step. Zero copy/paste.
- **Deploy + Interact steps** — Mix contract deployments and function calls in the same workflow. Deploy a token in step 1, call `setMinter` in step 3 using step 2's address.
- **9 EVM chains** — Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, BlockDAG Mainnet.
- **Execution engine** — Each step result is persisted to Supabase the moment it completes. If something fails mid-run, you have a full record of what deployed successfully.
- **Execution history** — Full table of past runs per recipe. Step-by-step breakdown. CSV export of all contract addresses and tx hashes.

### For teams

- **Share recipes** — Toggle a recipe public to get a shareable URL. Anyone can view and clone it into their own account.
- **Starter templates** — 6 pre-built workflow templates: ERC-20 + Staking, NFT Collection, DAO (Token + Timelock + Governor), Proxy Factory, Vesting, and more.
- **Public recipe view** — Read-only page accessible without authentication. Teams can share deployment runbooks as URLs.

### For builders who want to ship

- **Dark, premium UI** — Built for developers. Monospace fonts for addresses and hashes. Colour-coded step states (amber → running, green → success, red → failed).
- **No wallet lock-in** — Uses wagmi v2's injected connector. Works with MetaMask, Phantom (EVM mode), Rabby, and any browser wallet.
- **Pricing tiers** — Free (testnet, 3 recipes), Builder ($49/mo, mainnet + sharing), Team ($99/mo, shared workspace).

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 16** (App Router) | Server Components for data fetching, Client Components for wallet interaction. Turbopack for instant HMR. |
| Language | **TypeScript 5** (strict) | No `any`. Every type explicit. Compile-time guarantees across the full stack. |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first CSS with a headless component library. Dark theme via CSS variables — no theme switching overhead. |
| Builder state | **Zustand** | Flat, minimal store for recipe builder UI state. No context re-render cascades. |
| Server state | **TanStack Query v5** | Automatic caching, background refetch, and optimistic updates for Supabase data. |
| Database | **Supabase (PostgreSQL)** | Row Level Security on all tables. Users can only read/write their own data. Anonymous + wallet auth. |
| Wallet | **wagmi v2 + viem** | Type-safe EVM interactions. `deployContractAsync` and `writeContractAsync` for the execution engine. No ethers.js. |
| Payments | **Lemon Squeezy** | Webhook-based subscription management. Plan stored in Supabase user metadata. |
| Drag and drop | **@dnd-kit** | Accessible, performant drag-to-reorder for the recipe step list. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│                                                           │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │  Recipe Builder  │    │     Execution Engine         │ │
│  │  (Zustand store) │    │  useRecipeExecution hook     │ │
│  │                  │    │  ┌────────────────────────┐  │ │
│  │  - Step list     │    │  │  For each step:        │  │ │
│  │  - ABI upload    │    │  │  1. Resolve params     │  │ │
│  │  - Param config  │    │  │  2. deployContractAsync│  │ │
│  │  - Variable refs │    │  │     or writeContractAsync│ │ │
│  └─────────────────┘    │  │  3. Wait for receipt   │  │ │
│                          │  │  4. Persist to Supabase│  │ │
│  ┌─────────────────┐    │  └────────────────────────┘  │ │
│  │  wagmi v2        │    └──────────────────────────────┘ │
│  │  (wallet layer)  │                                      │
│  └────────┬─────────┘                                      │
│           │ signs txns                                     │
└───────────┼────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│   EVM Network       │    │   Supabase (PostgreSQL)       │
│   (user's wallet    │    │                               │
│    RPC endpoint)    │    │  recipes                      │
│                     │    │  recipe_steps                 │
│  Sepolia / Base /   │    │  executions (step_results[])  │
│  Mainnet / etc.     │    │                               │
└─────────────────────┘    │  RLS: users own their data    │
                           └──────────────────────────────┘
```

**Key design decisions:**
- **No backend RPC** — all on-chain calls go through the user's own wallet. FlowForge never holds private keys or controls user funds.
- **Client-side execution** — the recipe engine runs in the browser. This means execution pauses if the user closes the tab (v2 scope: background execution via service worker). All completed steps are already persisted.
- **Supabase as the only backend** — no Redis, no job queues, no custom API server. Supabase handles auth, data, and RLS enforcement.

---

## Database Schema

Three tables. Nothing else.

```sql
-- User-defined deployment workflows
recipes (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,
  name        text NOT NULL,
  description text,
  is_public   boolean DEFAULT false,
  created_at  timestamptz,
  updated_at  timestamptz
)

-- Ordered steps within a recipe
recipe_steps (
  id                 uuid PRIMARY KEY,
  recipe_id          uuid REFERENCES recipes CASCADE,
  step_order         integer NOT NULL,
  step_type          text CHECK (step_type IN ('deploy', 'interact')),
  label              text NOT NULL,
  abi                jsonb NOT NULL,
  bytecode           text,          -- deploy steps only
  target_address     text,          -- interact steps; supports ${step_N.contractAddress}
  function_name      text,          -- interact steps only
  constructor_params jsonb          -- [{name, type, value, isVariable, variableRef}]
)

-- Every recipe run, with per-step results persisted immediately
executions (
  id           uuid PRIMARY KEY,
  recipe_id    uuid REFERENCES recipes CASCADE,
  user_id      uuid REFERENCES auth.users,
  chain_id     integer NOT NULL,
  chain_name   text NOT NULL,
  status       text CHECK (status IN ('pending','running','partial','success','failed')),
  step_results jsonb,   -- [{stepOrder, status, txHash, contractAddress, errorMessage}]
  started_at   timestamptz,
  completed_at timestamptz
)
```

RLS policies: users can CRUD their own recipes and executions. Public recipes (`is_public = true`) are readable by anyone, including unauthenticated users.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A browser wallet (MetaMask, Phantom in EVM mode, or any injected wallet)
- A free [Supabase](https://supabase.com) account
- Sepolia ETH for testing (free from [sepoliafaucet.com](https://sepoliafaucet.com))

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

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9002

# Lemon Squeezy (leave blank for local dev)
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID=
```

### 3. Apply the database schema

Open the **SQL Editor** in your Supabase dashboard and run the contents of:

```
database/schema.sql
```

This creates the three tables, all indexes, RLS policies, and the `updated_at` trigger.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002).

---

## End-to-End Workflow

```
Sign in with wallet
       │
       ▼
Create a Recipe (name + optional description)
       │
       ▼
Add Steps in the Builder
  ├── Deploy Step: upload ABI + bytecode, configure constructor params
  │     └── Toggle "Use Variable" on any param to reference a prior step's output
  └── Interact Step: paste ABI, pick a write function, set target address
             └── Target address can also be a variable reference
       │
       ▼
Click "Run Recipe" → Select chain → Confirm
       │
       ▼
Execution Engine runs steps sequentially
  ├── Each step waits for wallet confirmation
  ├── On success: result persisted to Supabase immediately
  └── On failure: execution halts, partial results saved
       │
       ▼
Summary screen: copy all deployed addresses, export CSV, view history
```

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
│   ├── recipe/shared/[id]/       # Public recipe view (no auth)
│   └── pricing/                  # Pricing page
├── components/
│   ├── builder/                  # Builder UI: StepList, DeployStepConfig, InteractStepConfig, etc.
│   ├── execution/                # Execution UI: RunModal, StepProgressCard, ExecutionSummary, etc.
│   ├── recipe/                   # RecipeCard, PublicRecipeView, StarterTemplateGallery
│   ├── pricing/                  # PricingCard, BillingToggle
│   ├── common/                   # ConnectWalletButton, WalletSignIn
│   └── layout/                   # AppNav, AppShell, Providers
├── config/
│   ├── chains.ts                 # All 9 supported chains — single source of truth
│   ├── wagmi.ts                  # wagmi config
│   └── starterTemplates.ts       # 6 pre-built recipe templates (static JSON)
├── hooks/
│   └── useRecipeExecution.ts     # The execution engine — the most critical file
├── lib/
│   ├── abi/parser.ts             # ABI parsing (scoped: constructor + write functions only)
│   ├── actions/recipeActions.ts  # Server Actions: save, share, clone
│   ├── env.ts                    # Runtime env var validation (Zod)
│   ├── lemonsqueezy.ts           # Checkout + webhook signature verification
│   ├── supabase/                 # Typed client, server client, data access layer
│   └── validation/recipeSchemas.ts  # Zod schemas for step validation
├── stores/
│   └── recipeBuilderStore.ts     # Zustand: full builder UI state
├── types/                        # abi.ts, recipe.ts, execution.ts, chain.ts
└── utils/
    ├── resolveStepParam.ts       # Variable resolution engine (pure, testable)
    ├── encodeStepArgs.ts         # ABI argument encoding for viem
    ├── formatAddress.ts          # truncateAddress, isAddress
    └── formatExecutionError.ts   # Human-readable on-chain error messages
```

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

All chain configuration lives exclusively in `src/config/chains.ts`. Chain IDs, explorer URLs, and RPC transports are never hardcoded anywhere else in the codebase.

---

## Pricing

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0/mo | 3 recipes, testnet only, no sharing |
| **Builder** | $49/mo ($39 annual) | Unlimited recipes, mainnet, sharing, 6-month history |
| **Team** | $99/mo ($79 annual) | Everything in Builder + team workspace (5 members), 12-month history, priority support |

---

## Security Notes

- **No private keys** — FlowForge never touches your private keys. All transactions are signed by your own wallet.
- **Row Level Security** — Every Supabase table has RLS enabled. Users can only read and write their own data.
- **Server Actions authenticated** — All write operations (save, share, clone) verify the Supabase session server-side before executing.
- **Webhook verification** — Lemon Squeezy webhooks are verified with HMAC-SHA256 using `timingSafeEqual` to prevent timing attacks.
- **Env validation** — `src/lib/env.ts` validates all required environment variables at startup using Zod. Misconfigured deployments fail loudly, not silently.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the conventions in `Agent.md` — no `any` types, no ethers.js, no inline styles
4. Commit: `git commit -m 'feat: description'`
5. Push and open a PR against `main`

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/theweb3wizard">The Web3 Wizard (Khalid)</a> · For EVM developers who are done writing deployment scripts.
</p>
