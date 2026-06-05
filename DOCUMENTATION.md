# FlowForge — Technical Documentation

**Version:** 2.0 (Production Rebuild)
**Author:** The Web3 Wizard (Khalid)
**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · wagmi v2 · viem · Zustand · TanStack Query v5 · Supabase · Lemon Squeezy

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Database Schema & Security](#3-database-schema--security)
4. [Execution Engine](#4-execution-engine)
5. [Recipe Builder State Management](#5-recipe-builder-state-management)
6. [ABI Utilities & Variable Resolution](#6-abi-utilities--variable-resolution)
7. [Authentication Flow](#7-authentication-flow)
8. [Chain Configuration](#8-chain-configuration)
9. [Server Actions & Data Access](#9-server-actions--data-access)
10. [Pricing & Payments](#10-pricing--payments)
11. [Environment Variables](#11-environment-variables)
12. [Local Development Setup](#12-local-development-setup)
13. [Production Deployment](#13-production-deployment)
14. [Design Decisions & Tradeoffs](#14-design-decisions--tradeoffs)

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

1. Persists recipe configurations (steps, ABIs, bytecodes, parameter bindings) in Supabase
2. Provides a drag-and-drop visual builder with real-time state via Zustand
3. Executes recipes through a client-side React hook that calls wagmi's `deployContractAsync` / `writeContractAsync` in sequence
4. Persists each step result to Supabase immediately upon completion
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
│   ├── Server Components: data fetching via Supabase server client
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
└── Supabase JS client (browser)
    └── All reads/writes from client components

Supabase (PostgreSQL)
├── recipes table
├── recipe_steps table
├── executions table
└── RLS policies on all tables

EVM Networks (user's wallet RPC)
└── The user's wallet is the only signer — FlowForge has no server-side signing
```

### Request flow: Loading the builder

```
Browser → GET /recipe/[id]/builder
  │
  ├── (app)/layout.tsx [Server Component]
  │     └── Checks Supabase session → redirect /sign-in if unauthenticated
  │
  ├── recipe/[id]/builder/page.tsx [Server Component]
  │     ├── createServerClient() — Supabase server client with cookie auth
  │     ├── getRecipeWithSteps(supabase, id) — single round-trip with nested select
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
              ├── supabase.auth.getUser() — verify session
              ├── createExecution(supabase, userId, {recipeId, chainId, chainName})
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
                    │     updateExecutionStepResult(supabase, executionId, stepResult, current)
                    └── On failure:
                          finalizeExecution(supabase, executionId, 'partial'|'failed')
                          halt — do not continue to next step
```

---

## 3. Database Schema & Security

### Tables

```sql
-- Recipes: user-defined deployment workflows
CREATE TABLE recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text CHECK (char_length(description) <= 500),
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Steps: ordered actions within a recipe
CREATE TABLE recipe_steps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id         uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order        integer NOT NULL CHECK (step_order >= 0),
  step_type         text NOT NULL CHECK (step_type IN ('deploy', 'interact')),
  label             text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  contract_name     text,
  abi               jsonb NOT NULL DEFAULT '[]',
  bytecode          text,           -- nullable; deploy steps only
  target_address    text,           -- nullable; interact steps; supports ${step_N.contractAddress}
  function_name     text,           -- nullable; interact steps only
  constructor_params jsonb NOT NULL DEFAULT '[]',  -- [{name,type,value,isVariable,variableRef}]
  UNIQUE (recipe_id, step_order)
);

-- Executions: per-run record with persisted step results
CREATE TABLE executions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain_id     integer NOT NULL,
  chain_name   text NOT NULL,
  status       text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','partial','success','failed')),
  step_results jsonb NOT NULL DEFAULT '[]',
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
```

### Indexes

```sql
CREATE INDEX idx_recipes_user_id        ON recipes(user_id);
CREATE INDEX idx_recipes_is_public      ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_steps_order     ON recipe_steps(recipe_id, step_order);
CREATE INDEX idx_executions_recipe_id   ON executions(recipe_id);
CREATE INDEX idx_executions_user_id     ON executions(user_id);
```

### Row Level Security

```sql
-- recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or public" ON recipes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "insert own" ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update own" ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "delete own" ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- recipe_steps (inherits from parent recipe)
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read if recipe accessible" ON recipe_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_steps.recipe_id
    AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
  ));

-- (INSERT/UPDATE/DELETE policies check recipes.user_id = auth.uid())

-- executions
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own executions only" ON executions FOR ALL
  USING (auth.uid() = user_id);
```

### updated_at trigger

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
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
  executionId: string | null                // Supabase execution record ID
  error: string | null                      // top-level error if halted
}
```

### Step result persistence

Every step result is persisted to Supabase **immediately** upon completion via `updateExecutionStepResult`. This is the resume mechanism — if the user closes the browser mid-execution, all completed step results (contract addresses, tx hashes) are already in the database and visible in the execution history.

Critically: **Supabase persistence failure does NOT halt execution.** The DB write is best-effort. The UI state is the source of truth during a live run. This is intentional — a transient network hiccup shouldn't kill a multi-step deployment that's in the middle of expensive on-chain work.

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

### ABI argument encoding

```typescript
// src/utils/encodeStepArgs.ts
// Handles: address, bool, string, uint*/int*, bytes*
// Numeric types are cast to BigInt for viem compatibility
encodeStepArgValue('uint256', '1000000') → BigInt(1000000)
encodeStepArgValue('address', '0x...')  → '0x...' as `0x${string}`
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
| `initializeBuilder(recipe)` | Loads recipe from Supabase into the store on mount |
| `addStep(stepType)` | Appends a new step with a `temp_` UUID. Auto-selects it. |
| `removeStep(stepId)` | Removes step, reindexes all remaining `stepOrder` values |
| `reorderSteps(newOrder)` | Accepts array of step IDs in new order, reassigns stepOrder 0..N |
| `updateStepField(stepId, field, value)` | Generic update for any step field. Sets `isDirty: true`. |
| `updateStepParam(stepId, index, updates)` | Updates a single param in `constructorParams[]` |

### Broken variable reference detection

After a drag-and-drop reorder, `hasBrokenVariableRef(step, allSteps)` checks whether any `constructorParams` or `targetAddress` references a step that now comes *after* the current step. If so, `StepListItem` renders an amber warning triangle. The system does not auto-fix — it shows the warning and lets the user decide.

### Auto-save

`BuilderPage.tsx` runs a `setInterval` every 30 seconds. If `isDirty` is true, it calls `handleSave()` which:

1. Calls `updateRecipe()` with the current meta fields
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

The `getAvailableVariables` function populates the variable picker dropdowns in the builder. It only exposes outputs from steps with `stepOrder < currentStepOrder` — you can never reference a future step.

---

## 7. Authentication Flow

FlowForge uses Supabase's anonymous auth with wallet address stored in user metadata. This is a simplified launch pattern — full SIWE (Sign-In with Ethereum) is noted in the code as the migration path.

```
User connects wallet (wagmi useConnect)
         │
         ▼
WalletSignIn.tsx
  ├── supabase.auth.signInAnonymously()
  └── supabase.auth.updateUser({ data: { wallet_address: address } })
         │
         ▼
Supabase JWT stored in cookie
         │
         ▼
Every page load: proxy.ts (Next.js 16 proxy)
  └── updateSession(request) — refreshes session from cookie
         │
         ▼
Server Components: createServerClient() via @supabase/ssr
  └── Reads session from Next.js cookies
         │
         ▼
RLS enforcement: auth.uid() matched against user_id columns
```

The `proxy.ts` file (Next.js 16's replacement for `middleware.ts`) runs on every request to keep the Supabase session cookie fresh. This prevents the HTTP 431 "Request Header Too Large" error that accumulates stale session cookies.

---

## 8. Chain Configuration

All chain configuration is in `src/config/chains.ts`. Chain IDs, explorer URLs, and RPC transports are **never hardcoded anywhere else**. This is enforced by code review — it's an explicit guardrail in `Agent.md`.

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

BlockDAG (chain ID 1043) is defined via viem's `defineChain` utility since it's not in viem's built-in chain list.

Wagmi is configured with `http()` transports for all chains — no Alchemy/Infura dependency. The user's wallet provides the RPC connection.

---

## 9. Server Actions & Data Access

### Data access layer (`src/lib/supabase/`)

All data access functions follow the same contract:

```typescript
// Every function:
// 1. Accepts the Supabase client as first argument (never instantiates its own)
// 2. Returns { data: T | null; error: string | null }
// 3. Never throws
// 4. Maps snake_case DB columns to camelCase TypeScript types
// 5. Logs raw Supabase errors to console, returns human-readable strings to callers

async function getRecipeWithSteps(client: Supabase, recipeId: string)
  → Promise<{ data: RecipeWithSteps | null; error: string | null }>
```

The Supabase type is `SupabaseClient<Database, 'public', any>` — the `any` third generic is intentional and documented. The `@supabase/ssr` server client and the browser client have different third generics that TypeScript complains about without it.

### Step upsert strategy

`upsertSteps` splits into two operations:

```typescript
// Steps without an id (new, or temp_ prefixed) → INSERT (Supabase generates UUID)
// Steps with a real UUID → UPSERT with onConflict: 'id'
```

This is critical. Calling `.upsert()` on rows with `id: undefined` causes a PostgreSQL constraint error because Supabase can't resolve a conflict on a null primary key.

### Server Actions (`src/lib/actions/recipeActions.ts`)

```typescript
'use server'  // All functions in this file are Server Actions

saveRecipeAction(recipeId, meta, steps)   // Save builder state
togglePublicAction(recipeId, isPublic)    // Share/unshare recipe
cloneRecipeAction(sourceRecipeId)         // Copy recipe to current user's account
```

All Server Actions:
1. Call `createServerClient()` to get an authenticated Supabase instance
2. Verify `user.id === recipe.userId` before any write operation
3. Return `{ success: boolean; error?: string }` — never throw

---

## 10. Pricing & Payments

### Lemon Squeezy integration

```typescript
// src/lib/lemonsqueezy.ts (server-only)

// Creates a checkout session and returns the URL
createCheckoutUrl(variantId: string, userEmail?: string): Promise<string>

// Verifies HMAC-SHA256 webhook signature using timingSafeEqual (timing-attack safe)
verifyWebhookSignature(payload: string, signature: string): boolean
```

### Webhook handler (`src/app/api/webhooks/lemon-squeezy/route.ts`)

1. Reads raw request body as text
2. Verifies signature — returns `401` if invalid (no details exposed)
3. Handles `order_created` and `subscription_created` events
4. Maps variant ID to plan name via `LS_VARIANT_BUILDER` / `LS_VARIANT_TEAM` env vars
5. Updates `user_metadata.plan` via `supabase.auth.admin.updateUserById`

### Plan enforcement

Plan is stored in `user_metadata.plan` (`'free'` | `'builder'` | `'team'`). Free plan limits (3 recipes, testnet only, no sharing) are enforced at the application layer in Server Actions and the builder UI.

---

## 11. Environment Variables

```bash
# Required — validated by src/lib/env.ts (Zod) at startup
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key
NEXT_PUBLIC_APP_URL=               # Full app URL (http://localhost:9002 for dev)

# Required for payments (server-only — never prefix with NEXT_PUBLIC_)
LEMON_SQUEEZY_API_KEY=             # Lemon Squeezy API key
LEMON_SQUEEZY_WEBHOOK_SECRET=      # Webhook signing secret (HMAC-SHA256)
NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID= # Store ID

# Optional — map Lemon Squeezy variant IDs to plan names
LS_VARIANT_BUILDER=                # Variant ID for Builder plan
LS_VARIANT_TEAM=                   # Variant ID for Team plan
```

`src/lib/env.ts` validates the first three with Zod on module load. In development, validation failures log a warning but don't crash the server. In production, they throw immediately — misconfigured deployments fail loudly at startup.

---

## 12. Local Development Setup

```bash
# 1. Clone
git clone https://github.com/theweb3wizard/FlowForge.git
cd FlowForge

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Set NEXT_PUBLIC_APP_URL=http://localhost:9002

# 4. Database — run database/schema.sql in Supabase SQL Editor

# 5. Dev server
npm run dev
# Opens on http://localhost:9002
```

**Important for Windows:** Always use `http://localhost:9002`, not the network IP address. Browser wallets (MetaMask, Phantom) only allow injected connections from `localhost` in development mode.

**If you get HTTP 431:** Clear cookies for localhost:9002 in your browser DevTools (Application → Cookies → Delete All). This error is caused by accumulated stale Supabase session cookies, not a code bug.

---

## 13. Production Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in Vercel
3. Set all environment variables from Section 11
4. Deploy — Next.js is auto-detected

`vercel.json` configures:
- Security headers on all routes (X-Frame-Options: DENY, X-Content-Type-Options, etc.)
- Webhook route `maxDuration: 10` to handle Lemon Squeezy timeouts
- Framework: nextjs

### Supabase checklist

- [ ] Run `database/schema.sql` in the SQL Editor
- [ ] Confirm RLS enabled on all three tables
- [ ] Add production domain to Auth → URL Configuration → Allowed Redirect URLs
- [ ] Note: Supabase admin client (used by webhook) requires `service_role` key, not anon key

### robots.txt and sitemap

Both are generated via Next.js Metadata API:

- `robots.ts` allows `/`, `/pricing`, `/recipe/shared/*` and disallows `/dashboard`, `/api/*`, `/recipe/*/builder`
- `sitemap.ts` includes static routes plus all `is_public = true` recipe URLs

---

## 14. Design Decisions & Tradeoffs

### Why Zustand over React Context for builder state?

The recipe builder has a deep component tree: `BuilderPage → StepList → StepListItem` and `BuilderPage → DeployStepConfig → ParamConfigurator → VariablePicker`. React Context would cause re-renders across the entire tree on every state change (step label edit, param toggle, etc.). Zustand's selector pattern (`useStore(s => s.specificField)`) ensures each component only re-renders when its subscribed slice changes.

### Why client-side execution, not a server-side queue?

Every step requires a wallet signature from the user in real time. There is no way to automate this server-side. The execution loop waits at each step for the user to approve the MetaMask/Phantom popup. This is not a limitation — it's the correct security model for non-custodial tooling.

### Why only three database tables?

The original hackathon codebase had `contract_templates`, `deployments`, `recipe_executions`, `user_contract_templates`, and a `VIEW`. The rebuild reduced this to three tables by:

1. Moving templates to static JSON in `src/config/starterTemplates.ts` (6 pre-built templates, zero DB maintenance)
2. Eliminating the public deployments gallery (noise for new users, complexity for the system)
3. Merging execution tracking into `executions.step_results` JSONB instead of a separate table

This makes the schema easier to reason about, RLS policies simpler, and eliminates the N+1 query problem from the template viewer.

### Why is ABI parsing deliberately scoped?

The original `src/lib/abi/parser.ts` was 571 lines and tried to handle every possible ABI structure. It became a perpetual maintenance burden as each new contract type introduced edge cases. The rebuild scopes it to exactly what FlowForge needs:

- Constructor inputs (for deploy steps)
- Non-view, non-pure functions (for interact steps)

No tuple validation, no overload resolution, no struct unwrapping. Users who hit edge cases can see the error inline and fix their ABI.

### Why viem instead of ethers.js?

ethers.js v5 (which was in the original codebase) uses `BigNumber` instead of native `bigint`, has a 128kb bundle size, and has a fundamentally different API from wagmi v2. viem is wagmi v2's native peer dependency, uses native `bigint`, is tree-shakeable, and has a smaller bundle footprint. The migration was non-negotiable.

### Why anonymous Supabase auth instead of full SIWE?

SIWE (Sign-In with Ethereum) requires a backend nonce endpoint, a signing step, and a verification step — three round-trips for what should be a one-click flow. For v1 with tight build constraints, `signInAnonymously()` + `updateUser({ wallet_address })` achieves the same result: a unique, authenticated Supabase user identified by wallet address. The migration path to full SIWE is documented in `WalletSignIn.tsx`.

---

*FlowForge is built and maintained by [The Web3 Wizard (Khalid)](https://github.com/theweb3wizard).*
*For the product strategy and rebuild rationale, see `Revive.md`.*
*For the agent execution roadmap used to build this, see `Agent.md`.*
