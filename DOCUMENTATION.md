# FlowForge — Technical Documentation

**Version:** 3.0 (Neon Migration)
**Author:** The Web3 Wizard (Khalid)
**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · wagmi v2 · viem · Zustand · TanStack Query v5 · Neon Postgres · Drizzle ORM · Neon Auth

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Database Schema & Access](#3-database-schema--access)
4. [Execution Engine](#4-execution-engine)
5. [Recipe Builder State Management](#5-recipe-builder-state-management)
6. [ABI Utilities & Variable Resolution](#6-abi-utilities--variable-resolution)
7. [Authentication Flow](#7-authentication-flow)
8. [Chain Configuration](#8-chain-configuration)
9. [Server Actions & Data Access](#9-server-actions--data-access)
10. [Environment Variables](#10-environment-variables)
11. [Local Development Setup](#11-local-development-setup)
12. [Production Deployment](#12-production-deployment)
13. [Design Decisions & Tradeoffs](#13-design-decisions--tradeoffs)

---

## 1. Product Overview

### What it solves

Deploying an interconnected system of smart contracts — a DeFi protocol, a DAO, a token + vesting system — requires:

- Deploying contracts in a specific order
- Copying each deployed contract's address
- Pasting it as a constructor argument for the next contract
- Calling initialization functions that depend on addresses from prior steps

This process is manual, error-prone, and has to be repeated from scratch every time you deploy to a new network. Hardhat Ignition solves this in code, but requires a local dev environment and TypeScript knowledge. Remix requires manual copy/paste. OpenZeppelin Defender had a GUI but shut down July 1, 2026.

FlowForge solves it visually. You build a **Recipe** — an ordered list of steps — once. You run it on any EVM chain through your wallet. No scripts, no terminal, no private keys stored anywhere.

### What it is (technically)

A Next.js 16 full-stack web application that:

1. Persists recipe configurations (steps, ABIs, bytecodes, parameter bindings) in Neon Postgres via Drizzle ORM
2. Provides a drag-and-drop visual builder with real-time state via Zustand
3. Executes recipes through a client-side React hook that calls wagmi's `deployContractAsync` / `writeContractAsync` in sequence
4. Persists each step result to Neon immediately upon completion
5. Surfaces execution state in real-time through React state derived from the hook

### What it is NOT

- A custodial service — it never holds private keys
- A backend transaction broadcaster — all transactions go through the user's wallet
- A smart contract auditing tool — it deploys whatever bytecode you provide
- Dependent on any specific RPC provider — it uses the user's wallet RPC

---

## 2. Architecture

### System overview

```
Browser
├── Next.js App Router (RSC + Client Components)
│   ├── Server Components: data fetching via Drizzle (server-only)
│   ├── Client Components: wallet interaction, builder UI, execution UI
│   └── Server Actions: authenticated write operations
│
├── Zustand Store (recipeBuilderStore)
│   └── Recipe builder UI state: steps, selection, dirty tracking
│
├── wagmi v2 (wallet layer)
│   ├── useDeployContract → deployContractAsync
│   ├── useWriteContract → writeContractAsync
│   └── useSwitchChain → switchChainAsync
│
└── Neon Auth client (browser)
    └── Session management via cookies

Neon Postgres (via Drizzle ORM)
├── recipes table
├── recipe_steps table
├── executions table
├── deployments table
└── generation_log table

EVM Networks (user's wallet RPC)
└── The user's wallet is the only signer — FlowForge has no server-side signing
```

### Request flow: Loading the builder

```
Browser → GET /recipe/[id]/builder
  │
  ├── (app)/layout.tsx [Server Component]
  │     └── Checks Neon Auth session → redirect /sign-in if unauthenticated
  │
  ├── recipe/[id]/builder/page.tsx [Server Component]
  │     ├── getSession() — Neon Auth server cookie session
  │     ├── getUser() → userId
  │     ├── db.query.recipes.findFirst(...) — Drizzle query with steps eager-loaded
  │     └── Verifies recipe.userId === user.id → notFound() if mismatch
  │
  └── BuilderPage.tsx [Client Component]
        ├── initializeBuilder(recipe) — loads recipe into Zustand store
        ├── Renders BuilderToolbar + StepList + DeployStepConfig/InteractStepConfig
        └── setInterval 30s: if isDirty → handleSave()
```

### Request flow: Running a recipe

```
User clicks "Run Recipe"
  │
  ├── RunModal renders [Client Component]
  │     └── Stage 1: ChainSelector — user picks a chain
  │
  ├── "Confirm & Execute" clicked → Stage 2 mounts
  │
  └── ExecutionProgress mounts [Client Component]
        └── useEffect on mount → executeRecipe()
              │
              ├── getSession() — verify session via Server Action
              ├── createExecution(...) — insert via Drizzle Server Action
              ├── switchChainAsync({chainId}) — switch wallet to target network
              │
              └── for each step (sorted by stepOrder):
                    ├── Resolve params: resolveStepParam(param, completedResults[])
                    ├── IF deploy:
                    │     deployContractAsync({abi, bytecode, args, chainId})
                    │     waitForTransactionReceipt(wagmiConfig, {hash, chainId})
                    ├── IF interact:
                    │     resolveTargetAddress(step.targetAddress, completedResults)
                    │     writeContractAsync({address, abi, functionName, args, chainId})
                    │     waitForTransactionReceipt(...)
                    ├── On success:
                    │     updateExecutionStepResult(executionId, stepResult, current)
                    └── On failure:
                          finalizeExecution(executionId, 'partial'|'failed')
                          halt — do not continue to next step
```

---

## 3. Database Schema & Access

### Tables (defined in Drizzle ORM — `src/lib/db/schema.ts`)

```typescript
// Five tables managed via Drizzle schema:

recipes — User-defined deployment workflows
├── id: uuid (PK, default gen_random_uuid())
├── userId: text NOT NULL (Neon Auth user ID)
├── name: text NOT NULL
├── description: text
├── isPublic: boolean NOT NULL DEFAULT false
├── createdAt: timestamp NOT NULL DEFAULT now()
└── updatedAt: timestamp NOT NULL DEFAULT now()

recipe_steps — Ordered actions within a recipe
├── id: uuid (PK)
├── recipeId: uuid (FK → recipes, CASCADE DELETE)
├── stepOrder: integer NOT NULL
├── stepType: text NOT NULL ('deploy' | 'interact')
├── label: text NOT NULL
├── contractName: text
├── abi: jsonb NOT NULL DEFAULT '[]'
├── bytecode: text
├── targetAddress: text
├── functionName: text
├── constructorParams: jsonb NOT NULL DEFAULT '[]'
└── UNIQUE(recipeId, stepOrder)

executions — Per-run record with persisted step results
├── id: uuid (PK)
├── recipeId: uuid (FK → recipes, CASCADE DELETE)
├── userId: text NOT NULL
├── chainId: integer NOT NULL
├── chainName: text NOT NULL
├── status: text NOT NULL DEFAULT 'pending'
│     CHECK ('pending' | 'running' | 'partial' | 'success' | 'failed')
├── stepResults: jsonb NOT NULL DEFAULT '[]'
├── startedAt: timestamp NOT NULL DEFAULT now()
└── completedAt: timestamp

deployments — Deployed contracts from the playground
├── id: uuid (PK)
├── userId: text NOT NULL
├── recipeId: uuid (nullable — direct deploy from playground)
├── contractAddress: text NOT NULL
├── chainId: integer NOT NULL
├── txHash: text NOT NULL
├── abi: jsonb
├── metadata: jsonb
└── createdAt: timestamp NOT NULL DEFAULT now()

generation_log — AI usage tracking
├── id: uuid (PK)
├── userId: text NOT NULL
├── prompt: text NOT NULL
├── model: text NOT NULL
├── tokensIn: integer
├── tokensOut: integer
└── createdAt: timestamp NOT NULL DEFAULT now()
```

### Data access layer

The Drizzle client is initialized lazily via a Proxy pattern (`src/lib/db/index.ts`) to avoid build-time crashes when `DATABASE_URL` is not set:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    if (!_db) _db = createDb();
    return (_db as any)[prop];
  },
});
```

Data access functions are split by entity:

- `src/lib/db/recipes.ts` — `getRecipesByUser`, `getRecipeWithSteps`, `createRecipe`, `updateRecipe`, `deleteRecipe`
- `src/lib/db/recipeSteps.ts` — `getStepsByRecipe`, `upsertSteps`, `deleteStep`, `reorderSteps`
- `src/lib/db/executions.ts` — `createExecution`, `updateExecutionStepResult`, `finalizeExecution`, `getExecutionsByRecipe`, `getExecutionById`

All functions accept a Drizzle `db` instance as the first argument, return `{ data, error }` shaped results, and never throw.

### Indexes

```sql
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_steps_order ON recipe_steps(recipe_id, step_order);
CREATE INDEX idx_executions_recipe_id ON executions(recipe_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
```

---

## 4. Execution Engine

The execution engine lives entirely in `src/hooks/useRecipeExecution.ts`. It is the most architecturally sensitive file in the codebase.

### Why a custom hook, not a server-side job queue?

All transactions must be signed by the user's wallet in real time. There is no way to automate this server-side without the user pre-signing transactions (which introduces custodial risk). The execution loop *must* run client-side and pause at each step waiting for the user to approve the transaction in their wallet.

### State shape

```typescript
{
  executeRecipe: () => Promise<void>
  isRunning: boolean
  currentStepOrder: number | null   // null when not running
  stepStatuses: Record<number, StepStatus>  // stepOrder → 'pending'|'running'|'success'|'failed'
  completedResults: StepResult[]            // accumulated per-step results
  executionStatus: ExecutionStatus          // overall: 'pending'|'running'|'partial'|'success'|'failed'
  executionId: string | null                // Neon execution record ID
  error: string | null                      // top-level error if halted
}
```

### Step result persistence

Every step result is persisted to Neon **immediately** upon completion via server actions (`updateExecutionStepResult`). This is the resume mechanism — if the user closes the browser mid-execution, all completed step results (contract addresses, tx hashes) are already in the database and visible in the execution history.

Critically: **DB persistence failure does NOT halt execution.** The server action write is best-effort. The UI state is the source of truth during a live run. This is intentional — a transient network hiccup shouldn't kill a multi-step deployment that's in the middle of expensive on-chain work.

### Wallet disconnect detection

```typescript
// Watches isConnected from wagmi's useAccount
useEffect(() => {
  if (!isRunningRef.current) return;
  if (isConnected) return;
  if (disconnectHaltedRef.current) return;

  disconnectHaltedRef.current = true;
  // Halt execution, finalize with 'partial' or 'failed'
  // ...
}, [isConnected]);
```

If the user disconnects their wallet during execution, the hook detects it and finalizes the execution record with the appropriate status.

### Error formatting

All on-chain errors are intercepted and formatted to human-readable strings:

```typescript
// src/utils/formatExecutionError.ts
if (message.includes('User rejected')) → "Transaction was rejected in wallet."
if (message.includes('revert'))        → "Transaction reverted on-chain. Check your contract logic."
default                                → "Transaction failed. Please check the network and try again."
```

---

## 5. Recipe Builder State Management

The recipe builder uses Zustand (`src/stores/recipeBuilderStore.ts`). React Context was explicitly rejected to avoid re-render cascades across the two-panel layout.

### State

```typescript
{
  recipeId: string | null
  recipeName: string
  recipeDescription: string
  isPublic: boolean
  steps: RecipeStep[]
  selectedStepId: string | null
  isDirty: boolean       // true when unsaved changes exist
  isSaving: boolean
  lastSavedAt: Date | null
}
```

### Key actions

| Action | What it does |
|--------|-------------|
| `initializeBuilder(recipe)` | Loads recipe from the database into the store on mount |
| `addStep(stepType)` | Appends a new step with a `temp_` UUID. Auto-selects it. |
| `removeStep(stepId)` | Removes step, reindexes all remaining `stepOrder` values |
| `reorderSteps(newOrder)` | Accepts array of step IDs in new order, reassigns stepOrder 0..N |
| `updateStepField(stepId, field, value)` | Generic update for any step field. Sets `isDirty: true`. |
| `updateStepParam(stepId, index, updates)` | Updates a single param in `constructorParams[]` |

### Broken variable reference detection

After a drag-and-drop reorder, `hasBrokenVariableRef(step, allSteps)` checks whether any `constructorParams` or `targetAddress` references a step that now comes *after* the current step. If so, `StepListItem` renders an amber warning triangle. The system does not auto-fix — it shows the warning and lets the user decide.

### Auto-save

`BuilderPage.tsx` runs a `setInterval` every 30 seconds. If `isDirty` is true, it calls a Server Action which:

1. Calls `updateRecipe()` with the current meta fields via Drizzle
2. Calls `upsertSteps()` with all steps (new steps have no `id` → INSERT; existing steps have a UUID → UPSERT on conflict)

---

## 6. ABI Utilities & Variable Resolution

### ABI Parser (`src/lib/abi/parser.ts`)

Intentionally scoped. Does NOT attempt to validate every entry — only validates top-level array structure. This is by design: a full ABI validator is a rabbit hole with no bottom (nested structs, tuple types, overloaded functions, etc.).

```typescript
parseAbi(raw: unknown): ParsedAbi          // Accepts unknown; validates it's a JSON array
getConstructorInputs(abi): AbiInputParam[] // Returns constructor.inputs or []
getWriteFunctions(abi): AbiFunction[]      // nonpayable + payable functions only
getFunctionByName(abi, name): AbiFunction  // Lookup by name
buildDefaultParams(inputs): StepParamConfig[] // Pre-populates param list from ABI
isValidAbiJson(input: string): boolean     // Quick check before full parse
```

### Variable Resolution (`src/utils/resolveStepParam.ts`)

This is the most critical utility in the codebase. It resolves a parameter's value at execution time:

```typescript
resolveStepParam(param: StepParamConfig, completedResults: StepResult[]): string

// If param.isVariable === false: return param.value directly
// If param.isVariable === true:
//   Parse param.variableRef → "step_{N}.{field}"
//   Find completedResults entry where stepOrder === N AND status === 'success'
//   Return result.contractAddress or result.txHash (null → throw)
```

For `targetAddress` on interact steps:

```typescript
resolveTargetAddress(targetAddress: string, completedResults: StepResult[]): string
// If targetAddress matches ADDRESS_REGEX → return as-is
// If targetAddress matches ${step_N.contractAddress} → extract ref, call resolveStepParam
```

---

## 7. Authentication Flow

FlowForge uses **Neon Auth** (powered by Better Auth) with cookie-based sessions. Wallet address is used as the primary identity.

```
User connects wallet (wagmi useConnect)
         │
         ▼
WalletSignIn.tsx
  ├── Calls signInViaWallet() → sends wallet address to Neon Auth
  └── Neon Auth creates/returns user session
         │
         ▼
Session JWT stored in HTTP-only cookie
         │
         ▼
Every page load: proxy.ts (Next.js 16 middleware)
  └── auth.middleware() — refreshes session from cookie
         │
         ▼
Server Components: auth.server.ts
  └── getSession() — reads cookie, validates session
         │
         ▼
Route protection: recipes filtered by userId in Drizzle queries
```

The `proxy.ts` file (Next.js 16's replacement for `middleware.ts`) runs on every request to keep the auth session fresh.

### Auth client and server

- **Server:** `src/lib/auth/server.ts` — lazy-initialized via Proxy, provides `getSession()`, `getUser()`
- **Client:** `src/lib/auth/client.ts` — client-side auth for wallet sign-in
- **Middleware proxy:** `src/proxy.ts` — uses lazy `auth.middleware()` to avoid initialization at build time

---

## 8. Chain Configuration

All chain configuration is in `src/config/chains.ts`. Chain IDs, explorer URLs, and RPC transports are **never hardcoded anywhere else**.

```typescript
// src/config/chains.ts
export const SUPPORTED_CHAINS: SupportedChain[] = [
  { id: 1,        name: 'Ethereum Mainnet', shortName: 'ETH',  isTestnet: false, ... },
  { id: 11155111, name: 'Sepolia Testnet',  shortName: 'SEP',  isTestnet: true,  ... },
  { id: 8453,     name: 'Base',             shortName: 'BASE', isTestnet: false, ... },
  { id: 84532,    name: 'Base Sepolia',     shortName: 'BSEP', isTestnet: true,  ... },
  { id: 137,      name: 'Polygon',          shortName: 'MATIC',isTestnet: false, ... },
  { id: 42161,    name: 'Arbitrum One',     shortName: 'ARB',  isTestnet: false, ... },
  { id: 10,       name: 'Optimism',         shortName: 'OP',   isTestnet: false, ... },
  { id: 56,       name: 'BNB Smart Chain',  shortName: 'BSC',  isTestnet: false, ... },
  { id: 1043,     name: 'BlockDAG Mainnet', shortName: 'BDAG', isTestnet: false, ... },
] as const satisfies readonly SupportedChain[];

export const VIEM_CHAINS: Record<number, Chain> = { ... };  // For wagmi config
export function getChainById(id: number): SupportedChain | undefined
export function getExplorerTxUrl(chain, txHash): string
export function getExplorerAddressUrl(chain, address): string
```

Wagmi is configured with `http()` transports for all chains — no Alchemy/Infura dependency. The user's wallet provides the RPC connection.

---

## 9. Server Actions & Data Access

### Data access via Drizzle (`src/lib/db/`)

All data access functions follow the same contract:

```typescript
// Every function:
// 1. Accepts the Drizzle db instance as first argument
// 2. Returns { data: T | null; error: string | null }
// 3. Never throws
// 4. Uses lazy-initialized Proxy client (safe at build time)

async function getRecipeWithSteps(db: DbInstance, recipeId: string)
  → Promise<{ data: RecipeWithSteps | null; error: string | null }>
```

### Step upsert strategy

`upsertSteps` splits into two operations:

```typescript
// Steps without an id (new, or temp_ prefixed) → INSERT via Drizzle
// Steps with a real UUID → UPSERT with onConflict: 'id'
```

### Server Actions

```typescript
'server-only' imports from next — all DB code runs server-side

recipeActions.ts:
  saveRecipeAction(recipeId, meta, steps)   // Save builder state
  togglePublicAction(recipeId, isPublic)    // Share/unshare recipe
  cloneRecipeAction(sourceRecipeId)         // Copy recipe to current user

executionActions.ts:
  createExecutionAction(recipeId, chainId, chainName)  // Start execution
  updateExecutionStepResultAction(executionId, stepResult, currentResults)  // Per-step persist
  finalizeExecutionAction(executionId, status)  // Mark complete/failed
```

All Server Actions:
1. Call `getSession()` to verify the user is authenticated
2. Verify `user.id === recipe.userId` before any write operation
3. Return `{ success: boolean; error?: string }` — never throw

---

## 10. Environment Variables

```bash
# Required — validated by Drizzle client at first DB access
DATABASE_URL=                   # Neon Postgres connection string
NEON_AUTH_BASE_URL=             # Neon project base URL (for auth)
NEON_AUTH_COOKIE_SECRET=        # Cookie signing secret (min 32 chars)

# Required for AI features
OPENROUTER_API_KEY=             # OpenRouter API key

# App URL
NEXT_PUBLIC_APP_URL=            # Full app URL (http://localhost:9002 for dev)
```

---

## 11. Local Development Setup

```bash
# 1. Clone
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in DATABASE_URL, NEON_AUTH_BASE_URL, and NEON_AUTH_COOKIE_SECRET

# 4. Push database schema
npx drizzle-kit push

# 5. Dev server
npm run dev
# Opens on http://localhost:9002
```

**Important for Windows:** Always use `http://localhost:9002`, not the network IP address. Browser wallets (MetaMask, Phantom) only allow injected connections from `localhost` in development mode.

---

## 12. Production Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in Vercel
3. Set all environment variables from Section 10
4. Deploy — Next.js is auto-detected

### Neon checklist

- [ ] Database is created and accessible via `DATABASE_URL`
- [ ] Schema pushed via `npx drizzle-kit push`
- [ ] Neon Auth configured with correct redirect URLs
- [ ] Cookie secret is a long random string

### robots.txt and sitemap

Both are generated via Next.js Metadata API:
- `robots.ts` allows `/`, `/recipe/shared/*` and disallows `/dashboard`, `/api/*`, `/pricing`, `/recipe/*/builder`
- `sitemap.ts` includes static routes plus all `is_public = true` recipe URLs

---

## 13. Design Decisions & Tradeoffs

### Why Neon + Drizzle over Supabase?

The original codebase used Supabase (Auth + PostgreSQL + RLS). Three factors drove the migration:

1. **Auth simplicity** — Neon Auth provides cookie-based sessions out of the box with Better Auth, eliminating the complex SSR cookie pattern required by `@supabase/ssr`
2. **Drizzle's type safety** — Drizzle ORM generates fully typed queries from the schema, eliminating the manual duplicate type definitions required by Supabase
3. **Build-time safety** — Supabase client initialization crashes at build time if env vars are missing. Drizzle's lazy Proxy pattern (`db/index.ts`) defers initialization until first database access, making builds resilient to missing env vars during CI
4. **Scale-to-zero** — Neon's serverless Postgres scales to zero on inactivity, free tier includes 0.5 GB storage and branching for preview deployments

### Why lazy Proxy for db and auth?

Both `db` and `auth` modules are wrapped in JavaScript Proxies that defer initialization until the first property access. This prevents build-time crashes when environment variables are not set (e.g., during `next build` when DATABASE_URL is only available at runtime).

### Why Zustand over React Context for builder state?

The recipe builder has a deep component tree: `BuilderPage → StepList → StepListItem` and `BuilderPage → DeployStepConfig → ParamConfigurator → VariablePicker`. React Context would cause re-renders across the entire tree on every state change (step label edit, param toggle, etc.). Zustand's selector pattern (`useStore(s => s.specificField)`) ensures each component only re-renders when its subscribed slice changes.

### Why client-side execution, not a server-side queue?

Every step requires a wallet signature from the user in real time. There is no way to automate this server-side. The execution loop waits at each step for the user to approve the MetaMask/Phantom popup. This is not a limitation — it's the correct security model for non-custodial tooling.

### Why only five database tables?

The original hackathon codebase had `contract_templates`, `deployments`, `recipe_executions`, `user_contract_templates`, and a `VIEW`. The rebuild reduced this, then expanded slightly for the AI playground:

1. Templates moved to static JSON in `src/config/starterTemplates.ts` (6 pre-built templates, zero DB maintenance)
2. `deployments` table kept for playground deploy tracking (lightweight, not a public gallery)
3. `generation_log` table added for AI usage monitoring and quota management
4. All execution tracking in `executions.step_results` JSONB instead of a separate table

This keeps the schema small, RLS-equivalent checks simple (userId filtering in queries), and eliminates N+1 query problems.

### Why is ABI parsing deliberately scoped?

The original `src/lib/abi/parser.ts` was 571 lines and tried to handle every possible ABI structure. It became a perpetual maintenance burden as each new contract type introduced edge cases. The rebuild scopes it to exactly what FlowForge needs:

- Constructor inputs (for deploy steps)
- Non-view, non-pure functions (for interact steps)

No tuple validation, no overload resolution, no struct unwrapping. Users who hit edge cases can see the error inline and fix their ABI.

### Why viem instead of ethers.js?

ethers.js v5 uses `BigNumber` instead of native `bigint`, has a 128kb bundle size, and has a fundamentally different API from wagmi v2. viem is wagmi v2's native peer dependency, uses native `bigint`, is tree-shakeable, and has a smaller bundle footprint.

### Why light + dark mode?

Forced dark theme is a hallmark of AI-generated "slop" UIs. Adding proper light mode support with warm-neutral colors signals production quality and professionalism to paying clients. The theme toggle persists the user's preference in localStorage with a before-hydration script to prevent flash of unstyled content.

---

*FlowForge is built and maintained by [The Web3 Wizard (Khalid)](https://github.com/theweb3wizard).*
