# AGENT.MD — FlowForge Rebuild Execution Roadmap
**For:** AI Coding Agent (Cursor)  
**Authority Document:** `Revive.md` (must be present in the workspace root)  
**Author:** Web3 Wizard (Khalid)  
**Phase:** 2 — Agentic Build Execution

---

## CRITICAL PREAMBLE — READ BEFORE EVERY SINGLE PROMPT

This document is a chronological, modular build roadmap. You are a coding agent executing it. The strategy, architecture, and product decisions are finalized in `Revive.md`. Your job is to implement — not to redesign, not to suggest alternatives, not to add features that aren't specified.

**Before executing any prompt in this roadmap, re-read the relevant sections of `Revive.md`.** If there is any ambiguity between this document and `Revive.md`, `Revive.md` is the authority.

---

## SECTION A: AGENT BEHAVIOR & GUARDRAILS

These rules are active for every prompt in this roadmap. They do not expire. They do not have exceptions.

### A.1 — What You Are Allowed To Do
- Create new files in the locations specified by each prompt
- Modify existing files when the prompt explicitly names them
- Install npm packages when the prompt explicitly lists them
- Write TypeScript, TSX, CSS, SQL, and JSON
- Make implementation decisions within a prompt's scope that are consistent with the Revive.md architecture

### A.2 — What You Are Strictly Forbidden From Doing
- **Do not add features** not specified in this roadmap or in `Revive.md`. No "nice to have" extras.
- **Do not change the tech stack.** The stack is locked: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, wagmi v2, viem, Zustand, TanStack Query v5, Supabase, Lemon Squeezy. No substitutions.
- **Do not use `any` as a TypeScript type** anywhere in the codebase. Every type must be explicit. If a type is complex, define it properly in `src/types/`.
- **Do not hardcode any chain ID, RPC URL, or explorer URL** outside of `src/config/chains.ts`.
- **Do not use React Context for the recipe builder UI state.** Zustand is the state manager for the builder. Use TanStack Query for server state (Supabase data).
- **Do not create a `contract_templates` database table.** Templates are static JSON. They do not live in the database.
- **Do not create a public deployments feed or any feature that surfaces one user's data to other users** unless it's a deliberately shared recipe with `is_public = true`.
- **Do not install or reference Ethers.js.** The project uses viem exclusively for all blockchain interactions.
- **Do not write inline styles.** All styling goes through Tailwind utility classes or CSS variables defined in `globals.css`.
- **Do not create barrel `index.ts` exports inside feature folders** unless the prompt explicitly asks for them.
- **Do not generate mock data or placeholder logic** and mark it "TODO later." Every function must either work or throw an explicit, typed error. There is no "coming soon."

### A.3 — Code Quality Non-Negotiables
- Every function that interacts with Supabase must handle both the success and error path explicitly. No unhandled promise rejections.
- Every component that can render in a loading, empty, or error state must handle all three states visually.
- All user-facing error messages must be human-readable. Never surface raw RPC error strings, Supabase error codes, or JavaScript error stack traces to the UI. Intercept them, log them to the console for debugging, and display a clean message.
- Every Supabase query must include a `.throwOnError()` call or explicit error handling on the destructured `error` return value. Never silently swallow a Supabase error.
- TypeScript `strict` mode must remain `true` in `tsconfig.json`. Do not disable it or add `@ts-ignore` comments.
- Every file must be under 300 lines. If a component or hook grows beyond 300 lines, split it into sub-components or utility functions before proceeding.

### A.4 — File & Folder Naming Conventions
- All component files: `PascalCase.tsx` (e.g., `RecipeCard.tsx`)
- All hook files: `camelCase.ts` prefixed with `use` (e.g., `useRecipeExecution.ts`)
- All utility files: `camelCase.ts` (e.g., `resolveStepParam.ts`)
- All type files: `camelCase.ts` inside `src/types/` (e.g., `recipe.ts`)
- All config files: `camelCase.ts` inside `src/config/` (e.g., `chains.ts`)
- All Supabase data access files: `camelCase.ts` inside `src/lib/supabase/` (e.g., `recipes.ts`)
- Route folders: `kebab-case` inside `src/app/` (e.g., `src/app/recipe-builder/`)
- Page files: always `page.tsx` per Next.js App Router convention

### A.5 — Git Discipline
After completing each numbered prompt, the agent should note that a commit checkpoint is appropriate. Do not mix multiple prompts into one commit. Each prompt's output is one logical commit.

---

## SECTION B: ARCHITECTURAL NORTH STAR

Before every prompt, hold this mental model:

**The product is:** A visual builder where users create "Recipes" — ordered lists of EVM smart contract deployment and interaction steps — where each step's parameters can reference the output (contract address, tx hash) of any previous step. Users run these recipes against any EVM chain through their connected wallet. Recipes are saved to Supabase and optionally shared via URL.

**The three database tables are:** `recipes`, `recipe_steps`, `executions`. Nothing else.

**The execution engine is:** A single custom hook `useRecipeExecution.ts` that iterates steps sequentially, resolves variable references, calls wagmi's write/deploy hooks, persists each step result to Supabase immediately upon completion, and surfaces real-time state to the UI.

**The UI has five core screens:** Landing Page, My Recipes Dashboard, Recipe Builder, Execution Progress, Execution History.

**The chain config is:** A static curated list in `src/config/chains.ts`. It contains: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, and BlockDAG Mainnet. That list is the complete list. It does not grow unless a new prompt explicitly adds to it.

---

## SECTION C: PROMPT ROADMAP

---

### PROMPT ZERO — Environment Setup & Project Scaffold

**Objective:** Initialize the Next.js 15 project from scratch with the complete dependency set, folder structure, and base configuration. This prompt produces a running dev server with no features — only scaffolding.

**Exact steps to execute:**

1. Initialize a new Next.js 15 project using the App Router, TypeScript, Tailwind CSS, and the `src/` directory structure. When the CLI asks about import aliases, use `@/*` pointing to `./src/*`.

2. Install the following npm packages in one command:
   - `@supabase/supabase-js` `@supabase/ssr`
   - `wagmi` `viem` `@tanstack/react-query`
   - `zustand`
   - `react-hook-form` `@hookform/resolvers` `zod`
   - `lucide-react`
   - `clsx` `tailwind-merge`
   - `@radix-ui/react-dialog` `@radix-ui/react-dropdown-menu` `@radix-ui/react-select` `@radix-ui/react-tabs` `@radix-ui/react-tooltip` `@radix-ui/react-switch` `@radix-ui/react-toast`
   - `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities`
   - `sonner`

3. Initialize shadcn/ui with the following config: style `default`, base color `slate`, CSS variables enabled, TypeScript enabled. Then add the following shadcn/ui components: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `skeleton`, `switch`, `tabs`, `textarea`, `toast`, `tooltip`, `badge`, `progress`.

4. Create the following folder structure inside `src/`. Create every folder and place a `.gitkeep` file inside any folder that has no files yet:

```
src/
  app/
    (auth)/
      sign-in/
    (app)/
      dashboard/
      recipe/
        [id]/
          builder/
          run/
          history/
      recipe/
        shared/
          [id]/
    pricing/
    api/
      webhooks/
        lemon-squeezy/
  components/
    builder/
    common/
    execution/
    layout/
    recipe/
    ui/         ← shadcn/ui components live here (auto-generated)
  config/
  hooks/
  lib/
    abi/
    supabase/
  stores/
  types/
  utils/
```

5. Create `src/config/chains.ts` as an empty file with a single comment: `// Chain configuration — populated in Prompt 4`. Do not add any logic yet.

6. Create `.env.local` with the following keys and empty string values. Add a comment above each variable explaining what it is:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
   - `NEXT_PUBLIC_APP_URL` — The full URL of this app (e.g., https://flowforge.app or http://localhost:3000 for dev)
   - `LEMON_SQUEEZY_API_KEY` — Your Lemon Squeezy API key (server-only)
   - `LEMON_SQUEEZY_WEBHOOK_SECRET` — Your Lemon Squeezy webhook signing secret (server-only)
   - `NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID` — Your Lemon Squeezy store ID

7. Create `.env.example` as an exact copy of `.env.local` but with placeholder values instead of empty strings.

8. In `tsconfig.json`, confirm that `"strict": true` is set and that the `@/*` path alias resolves to `./src/*`.

9. In `tailwind.config.ts`, extend the `darkMode` to use `class`. The app is always in dark mode — this will be handled by adding `dark` class to the `<html>` element in the root layout.

10. In `src/app/globals.css`, define the following CSS variables inside both `:root` and `.dark` selectors. The app only uses dark mode, but define both for Tailwind compatibility. The values are:
    - `--background`: `#0A0A0A`
    - `--foreground`: `#FAFAFA`
    - `--card`: `#111111`
    - `--card-foreground`: `#FAFAFA`
    - `--border`: `#1F1F1F`
    - `--input`: `#1A1A1A`
    - `--primary`: `#FAFAFA`
    - `--primary-foreground`: `#0A0A0A`
    - `--muted`: `#1A1A1A`
    - `--muted-foreground`: `#737373`
    - `--accent`: `#1F1F1F`
    - `--accent-foreground`: `#FAFAFA`
    - `--destructive`: `#EF4444`
    - `--destructive-foreground`: `#FAFAFA`
    - `--success`: `#22C55E`
    - `--warning`: `#F59E0B`
    - `--ring`: `#525252`
    - `--radius`: `0.375rem`

11. Modify `src/app/layout.tsx` to add `class="dark"` to the `<html>` element. The body should use `bg-background text-foreground font-sans antialiased`.

12. Verify the dev server starts without errors with `npm run dev`.

**What this prompt produces:** A running Next.js 15 app with all dependencies installed, dark theme configured, folder structure in place, and environment variables documented. No UI, no logic.

**Do not:** Pre-populate any components, write any business logic, or create any database tables in this prompt.

---

### PROMPT 1 — Supabase Database Schema & Client Setup

**Objective:** Create the complete Supabase database schema (three tables, RLS policies, indexes) and set up the Supabase client utilities that the rest of the app will use.

**Files to create:**
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/types.ts`
- `src/middleware.ts`
- `database/schema.sql` (for documentation/migration reference — not auto-run)

**Part 1: `database/schema.sql`**

Create a comprehensive SQL migration file. This is not executed automatically — it is the canonical reference for the database structure. The developer will run it manually in the Supabase SQL Editor.

The file must contain, in order:

1. Extension enablement: `uuid-ossp` for `gen_random_uuid()`.

2. **`recipes` table:**
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id`: `uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `name`: `text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100)`
   - `description`: `text CHECK (char_length(description) <= 500)`
   - `is_public`: `boolean NOT NULL DEFAULT false`
   - `created_at`: `timestamptz NOT NULL DEFAULT now()`
   - `updated_at`: `timestamptz NOT NULL DEFAULT now()`

3. **`recipe_steps` table:**
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `recipe_id`: `uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE`
   - `step_order`: `integer NOT NULL CHECK (step_order >= 0)`
   - `step_type`: `text NOT NULL CHECK (step_type IN ('deploy', 'interact'))`
   - `label`: `text NOT NULL CHECK (char_length(label) >= 1 AND char_length(label) <= 80)`
   - `contract_name`: `text`
   - `abi`: `jsonb NOT NULL DEFAULT '[]'::jsonb`
   - `bytecode`: `text` — nullable, only used for deploy steps
   - `target_address`: `text` — nullable, only used for interact steps; can contain variable ref syntax like `${step_0.contractAddress}`
   - `function_name`: `text` — nullable, only used for interact steps
   - `constructor_params`: `jsonb NOT NULL DEFAULT '[]'::jsonb` — array of param config objects
   - `UNIQUE(recipe_id, step_order)`

4. **`executions` table:**
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `recipe_id`: `uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE`
   - `user_id`: `uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `chain_id`: `integer NOT NULL`
   - `chain_name`: `text NOT NULL`
   - `status`: `text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'partial', 'success', 'failed'))`
   - `step_results`: `jsonb NOT NULL DEFAULT '[]'::jsonb`
   - `started_at`: `timestamptz NOT NULL DEFAULT now()`
   - `completed_at`: `timestamptz`

5. **Indexes:**
   - `CREATE INDEX idx_recipes_user_id ON recipes(user_id)`
   - `CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true`
   - `CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id)`
   - `CREATE INDEX idx_recipe_steps_order ON recipe_steps(recipe_id, step_order)`
   - `CREATE INDEX idx_executions_recipe_id ON executions(recipe_id)`
   - `CREATE INDEX idx_executions_user_id ON executions(user_id)`

6. **`updated_at` trigger:** Create a function `handle_updated_at()` that sets `NEW.updated_at = now()` and attach it as a `BEFORE UPDATE` trigger on the `recipes` table.

7. **Row Level Security Policies:**

   Enable RLS on all three tables: `ALTER TABLE recipes ENABLE ROW LEVEL SECURITY`, same for `recipe_steps` and `executions`.

   For `recipes`:
   - `SELECT`: `(auth.uid() = user_id) OR (is_public = true)` — users can read their own recipes and all public recipes
   - `INSERT`: `auth.uid() = user_id` — users can only insert their own
   - `UPDATE`: `auth.uid() = user_id` — users can only update their own
   - `DELETE`: `auth.uid() = user_id` — users can only delete their own

   For `recipe_steps`:
   - `SELECT`: `EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_steps.recipe_id AND (recipes.user_id = auth.uid() OR recipes.is_public = true))`
   - `INSERT`: `EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_steps.recipe_id AND recipes.user_id = auth.uid())`
   - `UPDATE`: same as INSERT
   - `DELETE`: same as INSERT

   For `executions`:
   - All policies: `auth.uid() = user_id` — users can only see and manage their own execution history

**Part 2: Supabase TypeScript Types — `src/lib/supabase/types.ts`**

Define a `Database` type object that mirrors the three tables exactly. This is the type that gets passed to the Supabase client generic. Include `Row`, `Insert`, and `Update` sub-types for each table. This is not auto-generated — write it manually based on the schema above. Keep it in sync with `schema.sql`.

**Part 3: Supabase Client Files**

`src/lib/supabase/client.ts` — creates and exports a browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`. It reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from environment variables. Export as a function `createClient()` that returns the typed client.

`src/lib/supabase/server.ts` — creates and exports a server-side Supabase client using `createServerClient` from `@supabase/ssr` that reads from Next.js cookies. This is used in Server Components and Route Handlers. Export as an async function `createServerClient()`.

`src/lib/supabase/middleware.ts` — exports an `updateSession` function that refreshes the user's auth session in middleware using the `@supabase/ssr` cookie pattern.

`src/middleware.ts` — calls `updateSession` from the above file. Match all routes except `/_next/`, `/favicon.ico`, and `/api/webhooks/`. This ensures auth sessions stay fresh on navigation.

**What this prompt produces:** A fully defined database schema, Supabase TypeScript types, and three client utilities. No UI, no data access functions yet (those come in Prompt 3).

**Do not:** Write any data access functions (no `getRecipes`, `createRecipe`, etc.) in this prompt. Do not wire up authentication UI. Do not create any React components.

---

### PROMPT 2 — Core TypeScript Types

**Objective:** Define all application-level TypeScript types and Zod validation schemas that will be used throughout the entire codebase. This is the single source of truth for data shapes.

**Files to create:**
- `src/types/recipe.ts`
- `src/types/execution.ts`
- `src/types/chain.ts`
- `src/types/abi.ts`
- `src/types/index.ts`

**`src/types/abi.ts`**

Define the following types based on the EVM ABI standard:

- `AbiInputParam`: `{ name: string; type: string; internalType?: string; components?: AbiInputParam[] }`
- `AbiFunction`: `{ type: 'function'; name: string; inputs: AbiInputParam[]; outputs: AbiInputParam[]; stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable' }`
- `AbiConstructor`: `{ type: 'constructor'; inputs: AbiInputParam[]; stateMutability: 'nonpayable' | 'payable' }`
- `AbiEvent`: `{ type: 'event'; name: string; inputs: (AbiInputParam & { indexed: boolean })[] }`
- `AbiEntry`: `AbiFunction | AbiConstructor | AbiEvent | { type: 'fallback' | 'receive' }`
- `ParsedAbi`: `AbiEntry[]`

**`src/types/recipe.ts`**

- `StepParamConfig`: Represents a single constructor or function parameter's configuration in a recipe step.
  ```
  {
    name: string           // param name from ABI
    type: string           // param type from ABI (e.g., 'address', 'uint256')
    value: string          // the raw value (empty string if isVariable is true)
    isVariable: boolean    // whether this param is bound to a previous step's output
    variableRef: string | null  // if isVariable, the ref string e.g. "step_0.contractAddress"
  }
  ```

- `StepType`: `'deploy' | 'interact'`

- `RecipeStep`: The full application-level shape of a step (not the DB row — includes computed fields):
  ```
  {
    id: string
    recipeId: string
    stepOrder: number
    stepType: StepType
    label: string
    contractName: string | null
    abi: ParsedAbi
    bytecode: string | null
    targetAddress: string | null
    functionName: string | null
    constructorParams: StepParamConfig[]
  }
  ```

- `Recipe`:
  ```
  {
    id: string
    userId: string
    name: string
    description: string | null
    isPublic: boolean
    createdAt: string
    updatedAt: string
    steps?: RecipeStep[]   // optionally populated
  }
  ```

- `RecipeWithSteps`: `Recipe & { steps: RecipeStep[] }` — always has steps populated

- `CreateRecipePayload`: `{ name: string; description?: string }`
- `UpdateRecipePayload`: `Partial<Pick<Recipe, 'name' | 'description' | 'isPublic'>>`
- `UpsertStepPayload`: `Omit<RecipeStep, 'id'> & { id?: string }` — used for creating or updating steps

**`src/types/execution.ts`**

- `StepStatus`: `'pending' | 'running' | 'success' | 'failed'`

- `StepResult`:
  ```
  {
    stepOrder: number
    stepLabel: string
    status: StepStatus
    txHash: string | null
    contractAddress: string | null
    errorMessage: string | null
    completedAt: string | null
  }
  ```

- `ExecutionStatus`: `'pending' | 'running' | 'partial' | 'success' | 'failed'`

- `Execution`:
  ```
  {
    id: string
    recipeId: string
    userId: string
    chainId: number
    chainName: string
    status: ExecutionStatus
    stepResults: StepResult[]
    startedAt: string
    completedAt: string | null
  }
  ```

- `CreateExecutionPayload`: `{ recipeId: string; chainId: number; chainName: string }`

**`src/types/chain.ts`**

- `SupportedChain`:
  ```
  {
    id: number            // EVM chain ID
    name: string          // Display name e.g. "Ethereum Mainnet"
    shortName: string     // Short name for badges e.g. "ETH"
    isTestnet: boolean
    explorerUrl: string   // Base URL for block explorer, e.g. "https://etherscan.io"
    explorerName: string  // e.g. "Etherscan"
    iconUrl: string | null
  }
  ```

**`src/types/index.ts`**

Re-export everything from `recipe.ts`, `execution.ts`, `chain.ts`, and `abi.ts` as named exports. This file should have no logic — only re-exports.

**Do not:** Create Zod schemas in this prompt. Zod validation schemas belong in a separate `src/lib/validation/` folder and will be created in the prompt that needs them (Prompt 11, the Zustand store for the builder).

---

### PROMPT 3 — Supabase Data Access Layer

**Objective:** Build all data access functions for the three database tables. These are pure async functions — no React hooks, no UI. They form the complete API for reading and writing application data.

**Files to create:**
- `src/lib/supabase/recipes.ts`
- `src/lib/supabase/recipeSteps.ts`
- `src/lib/supabase/executions.ts`

**Rules for every function in this prompt:**
- All functions must accept the Supabase client as the first argument. Do not instantiate a client inside these functions. The caller creates the client and passes it in. This makes them usable from both Server Components (server client) and Client Components (browser client) without duplication.
- All functions must return `Promise<{ data: T | null; error: string | null }>`. Never throw. Always return a typed result object. Format error messages as human-readable strings, not raw Supabase error objects.
- All returned data must be mapped from snake_case database column names to camelCase TypeScript types (using the types from Prompt 2).

**`src/lib/supabase/recipes.ts` — functions to implement:**

1. `getRecipesByUser(client, userId)` → `Promise<{ data: Recipe[] | null; error: string | null }>` — fetches all recipes owned by the user, ordered by `updated_at DESC`. Does NOT include steps.

2. `getRecipeById(client, recipeId)` → `Promise<{ data: Recipe | null; error: string | null }>` — fetches a single recipe by ID. If the recipe doesn't exist OR the user has no access per RLS, return `{ data: null, error: 'Recipe not found' }`.

3. `getRecipeWithSteps(client, recipeId)` → `Promise<{ data: RecipeWithSteps | null; error: string | null }>` — fetches a recipe and all its steps in one round trip using Supabase's nested select syntax. Steps must be ordered by `step_order ASC`. Map the entire response to the `RecipeWithSteps` type.

4. `createRecipe(client, userId, payload: CreateRecipePayload)` → `Promise<{ data: Recipe | null; error: string | null }>` — inserts a new recipe. Sets `user_id` to the passed `userId`.

5. `updateRecipe(client, recipeId, payload: UpdateRecipePayload)` → `Promise<{ data: Recipe | null; error: string | null }>` — updates a recipe. Only the caller's own recipes can be updated (RLS enforces this, but also validate that `recipeId` is provided before calling Supabase).

6. `deleteRecipe(client, recipeId)` → `Promise<{ error: string | null }>` — deletes a recipe and all its steps (CASCADE handles steps). Returns only an error field, no data.

**`src/lib/supabase/recipeSteps.ts` — functions to implement:**

1. `getStepsByRecipe(client, recipeId)` → `Promise<{ data: RecipeStep[] | null; error: string | null }>` — fetches all steps for a recipe, ordered by `step_order ASC`.

2. `upsertSteps(client, steps: UpsertStepPayload[])` → `Promise<{ data: RecipeStep[] | null; error: string | null }>` — bulk upsert for saving all steps of a recipe at once. Uses Supabase's `upsert` with `onConflict: 'id'`. This is the save operation for the recipe builder — it replaces the entire step list.

3. `deleteStep(client, stepId)` → `Promise<{ error: string | null }>` — deletes a single step by ID.

4. `reorderSteps(client, recipeId, orderedStepIds: string[])` → `Promise<{ error: string | null }>` — takes an ordered array of step IDs and updates the `step_order` field for each step to match the array's index. This is the operation called after a drag-and-drop reorder. Execute this as multiple `update` calls, not a single SQL query.

**`src/lib/supabase/executions.ts` — functions to implement:**

1. `createExecution(client, userId, payload: CreateExecutionPayload)` → `Promise<{ data: Execution | null; error: string | null }>` — creates a new execution record with `status: 'running'` and `step_results: []`.

2. `updateExecutionStepResult(client, executionId, stepResult: StepResult, currentStepResults: StepResult[])` → `Promise<{ error: string | null }>` — this is called after every step in the execution engine. It takes the completed `StepResult`, appends it to `currentStepResults`, and updates the `step_results` JSONB column. This is the persistence mechanism that makes execution resumable.

3. `finalizeExecution(client, executionId, status: 'success' | 'partial' | 'failed')` → `Promise<{ error: string | null }>` — updates the execution's `status` and sets `completed_at` to now.

4. `getExecutionsByRecipe(client, recipeId)` → `Promise<{ data: Execution[] | null; error: string | null }>` — fetches all executions for a recipe, ordered by `started_at DESC`.

5. `getExecutionById(client, executionId)` → `Promise<{ data: Execution | null; error: string | null }>` — fetches a single execution with all its step results.

**What this prompt produces:** A complete, typed, error-safe data access layer. No UI, no hooks that call these functions yet.

---

### PROMPT 4 — EVM Chain Configuration & Wallet Provider

**Objective:** Build the complete chain configuration list and the wagmi/viem provider setup that wraps the entire application.

**Files to create/modify:**
- `src/config/chains.ts` (replace the placeholder from Prompt 0)
- `src/config/wagmi.ts`
- `src/components/layout/Providers.tsx`
- `src/app/layout.tsx` (modify to wrap with Providers)

**`src/config/chains.ts`**

Import chain definitions from `viem/chains` for all built-in chains. For BlockDAG, define a custom chain object manually since it is not in viem's built-in list. Use the viem `defineChain` utility.

Build and export a `SUPPORTED_CHAINS` array of type `SupportedChain[]` (from `src/types/chain.ts`) with exactly these entries, in this order:

1. Ethereum Mainnet — id: 1, explorerUrl: `https://etherscan.io`, explorerName: `Etherscan`, isTestnet: false
2. Sepolia Testnet — id: 11155111, explorerUrl: `https://sepolia.etherscan.io`, explorerName: `Etherscan`, isTestnet: true
3. Base — id: 8453, explorerUrl: `https://basescan.org`, explorerName: `Basescan`, isTestnet: false
4. Base Sepolia — id: 84532, explorerUrl: `https://sepolia.basescan.org`, explorerName: `Basescan`, isTestnet: true
5. Polygon — id: 137, explorerUrl: `https://polygonscan.com`, explorerName: `Polygonscan`, isTestnet: false
6. Arbitrum One — id: 42161, explorerUrl: `https://arbiscan.io`, explorerName: `Arbiscan`, isTestnet: false
7. Optimism — id: 10, explorerUrl: `https://optimistic.etherscan.io`, explorerName: `Optimism Explorer`, isTestnet: false
8. BNB Smart Chain — id: 56, explorerUrl: `https://bscscan.com`, explorerName: `BscScan`, isTestnet: false
9. BlockDAG Mainnet — id: 1043 (use the chain ID that was in the original project's config), explorerUrl: from the BlockDAG mainnet explorer URL in the original project's `.env`, explorerName: `BlockDAG Explorer`, isTestnet: false

Also export:
- `TESTNET_CHAIN_IDS: number[]` — array of the testnet chain IDs from the list above
- `getChainById(id: number): SupportedChain | undefined` — utility function
- `getExplorerTxUrl(chain: SupportedChain, txHash: string): string` — returns `${chain.explorerUrl}/tx/${txHash}`
- `getExplorerAddressUrl(chain: SupportedChain, address: string): string` — returns `${chain.explorerUrl}/address/${address}`

Also export a `VIEM_CHAINS` object: a mapping from chain ID to the corresponding viem chain object (imported from `viem/chains` or created via `defineChain` for BlockDAG). This object is used by wagmi's config.

**`src/config/wagmi.ts`**

Create and export the wagmi config using `createConfig` from wagmi. Pass all chains from `VIEM_CHAINS` values as the `chains` array. Use `http()` as the transport for each chain (viem's default HTTP transport — no custom RPC URLs, no Alchemy/Infura accounts required). Enable `ssr: true`.

**`src/components/layout/Providers.tsx`**

Create a client component (`'use client'` directive at top) that wraps children with:
1. `WagmiProvider` from wagmi, passing the config from `wagmi.ts`
2. `QueryClientProvider` from TanStack Query, with a `QueryClient` created with `useState` for SSR safety
3. `Toaster` from `sonner` for toast notifications — positioned `bottom-right`, dark theme

The component takes `children: React.ReactNode` as its only prop.

**`src/app/layout.tsx`**

Modify the root layout to wrap `{children}` with `<Providers>`. Keep the `dark` class on `<html>`. Import the `Providers` component.

**What this prompt produces:** A fully configured wallet connection layer and chain support. The app can now connect to any supported EVM chain.

---

### PROMPT 5 — ABI Utilities & Variable Resolution Engine

**Objective:** Build two pure utility modules that are the foundation of the execution engine — ABI parsing (scoped and limited) and variable reference resolution.

**Files to create:**
- `src/lib/abi/parser.ts`
- `src/utils/resolveStepParam.ts`
- `src/utils/formatAddress.ts`

**`src/lib/abi/parser.ts`**

This file replaces the existing over-engineered parser from the original project. The scope is deliberately limited.

Implement the following exported functions:

1. `parseAbi(raw: unknown): ParsedAbi` — Accepts any unknown value (from a JSON upload or text paste). Validates that it is a JSON array. If it is a JSON string, parses it first. Returns a `ParsedAbi` array. Throws a typed `AbiParseError` if the input is not a valid ABI array. Does NOT attempt to validate every entry in detail — only validates the top-level array structure.

2. `getConstructorInputs(abi: ParsedAbi): AbiInputParam[]` — Finds the constructor entry in the ABI and returns its `inputs` array. If no constructor is found, returns an empty array (contracts with no constructor have no parameters).

3. `getWriteFunctions(abi: ParsedAbi): AbiFunction[]` — Returns only ABI entries where `type === 'function'` and `stateMutability` is either `'nonpayable'` or `'payable'`. These are the only functions relevant for interact steps.

4. `getFunctionByName(abi: ParsedAbi, name: string): AbiFunction | undefined` — Finds a specific function by name in the ABI. Returns `undefined` if not found.

5. `buildDefaultParams(inputs: AbiInputParam[]): StepParamConfig[]` — Takes an array of ABI input params and returns a `StepParamConfig[]` array with default values: `value: ''`, `isVariable: false`, `variableRef: null`. This is called when a user selects a new function or uploads a new ABI — it pre-populates the param list.

6. `isValidAbiJson(input: string): boolean` — Returns true if the string can be parsed as a JSON array, false otherwise. Used for real-time validation in form inputs before fully parsing.

Define a custom error class `AbiParseError extends Error` with a `message` field that contains a human-readable description of what went wrong (e.g., "ABI must be a JSON array").

**`src/utils/resolveStepParam.ts`**

This is the most critical utility function in the entire codebase. It resolves a single parameter's value at execution time.

Implement: `resolveStepParam(param: StepParamConfig, completedResults: StepResult[]): string`

Logic:
- If `param.isVariable === false`: return `param.value` directly
- If `param.isVariable === true`:
  - If `param.variableRef === null`: throw `new Error(`Variable reference not set for param "${param.name}"`)
  - Parse `param.variableRef` which has the format `"step_{stepOrder}.{field}"` where field is one of: `contractAddress`, `txHash`
  - Find the entry in `completedResults` where `stepOrder === parsedStepOrder` AND `status === 'success'`
  - If not found: throw `new Error(`Step ${parsedStepOrder} has not completed successfully. Cannot resolve variable reference.`)`
  - If field is `contractAddress`: return `completedResult.contractAddress`. If it is null, throw `new Error(`Step ${parsedStepOrder} did not produce a contract address.`)`
  - If field is `txHash`: return `completedResult.txHash`. If it is null, throw `new Error(`Step ${parsedStepOrder} did not produce a transaction hash.`)`
  - If field is unrecognized: throw `new Error(`Unknown variable field "${field}". Supported fields: contractAddress, txHash.`)`

Also implement: `getAvailableVariables(allSteps: RecipeStep[], currentStepOrder: number): Array<{ label: string; value: string }>` — Returns a list of variable options available for a step at `currentStepOrder`. A step can reference outputs from any step with `stepOrder < currentStepOrder`. For each eligible previous step, return two entries: one for `contractAddress` (only if it's a deploy step) and one for `txHash`. Format the `label` as `"Step {N+1}: {stepLabel} → contractAddress"` and the `value` as `"step_{N}.contractAddress"`.

**`src/utils/formatAddress.ts`**

Implement:
- `truncateAddress(address: string): string` — returns the first 6 and last 4 characters of an address, e.g., `0x1234...5678`
- `isAddress(value: string): boolean` — returns true if the string matches the pattern of a valid Ethereum address (0x + 40 hex chars). Use a regex, not viem's `isAddress` — keep this utility dependency-free.

**What this prompt produces:** Three pure utility modules. No React, no Supabase, no wagmi. These are testable in isolation.

---

### PROMPT 6 — Recipe Execution Hook

**Objective:** Build `useRecipeExecution` — the core stateful hook that powers the entire execution flow. This is the most architecturally sensitive file in the codebase.

**Files to create:**
- `src/hooks/useRecipeExecution.ts`

**Behavioral specification — read carefully:**

This hook manages the entire lifecycle of running a recipe. It is a client-side React hook. It accepts a `RecipeWithSteps` and a `SupportedChain`. It returns a state object and an `executeRecipe` function.

**Return shape:**
```
{
  executeRecipe: () => Promise<void>
  isRunning: boolean
  currentStepOrder: number | null    // which step is currently executing, null if not running
  stepStatuses: Record<number, StepStatus>  // stepOrder → current status
  completedResults: StepResult[]     // accumulated results of completed steps
  executionStatus: ExecutionStatus   // overall execution status
  executionId: string | null         // the Supabase execution record ID
  error: string | null               // top-level error message if execution is aborted
}
```

**Implementation requirements:**

1. On `executeRecipe()` call:
   a. Validate that a wallet is connected (use wagmi's `useAccount`). If not, set `error` and return immediately.
   b. Create a new execution record in Supabase via `createExecution` from `src/lib/supabase/executions.ts`. Store the returned `executionId` in state.
   c. Set `isRunning: true`, `executionStatus: 'running'`.
   d. Iterate over `recipe.steps` in order of `step_order`.

2. For each step:
   a. Set `currentStepOrder` to the step's `step_order`.
   b. Set `stepStatuses[step.stepOrder] = 'running'`.
   c. Resolve all parameters using `resolveStepParam` for each param in `step.constructorParams`. If any resolution throws, catch it, set `stepStatuses[step.stepOrder] = 'failed'`, call `updateExecutionStepResult` with the error message, call `finalizeExecution` with `'partial'`, set `executionStatus: 'partial'`, set `error` to the caught message, set `isRunning: false`, and return.
   d. If `step.stepType === 'deploy'`:
      - Use wagmi's `useDeployContract` hook (connected to the selected chain) to deploy with the resolved constructor arguments. Wait for the transaction receipt.
      - On success: extract `contractAddress` from the receipt. Create a `StepResult` object with `status: 'success'`, the `contractAddress`, and the `txHash`.
   e. If `step.stepType === 'interact'`:
      - Resolve the `targetAddress` (it may also be a variable reference — treat it the same as params).
      - Use wagmi's `useWriteContract` to call the specified function with the resolved arguments. Wait for the transaction receipt.
      - On success: create a `StepResult` with `status: 'success'`, the `txHash`, and `contractAddress: null`.
   f. On any on-chain error (user rejection, revert, RPC failure, timeout):
      - Catch the error.
      - Format the error: if it contains "User rejected", use "Transaction was rejected in wallet."; if it contains "revert", use "Transaction reverted on-chain. Check your contract logic."; for all other errors, use "Transaction failed. Please check the network and try again."
      - Set `StepResult` with `status: 'failed'` and the formatted error message.
      - Call `updateExecutionStepResult` in Supabase.
      - Call `finalizeExecution` with `'partial'` if any steps completed before this one, or `'failed'` if this was the first step.
      - Set `executionStatus` accordingly, set `error`, set `isRunning: false`, and **stop the iteration** — do not proceed to the next step.
   g. On success of a step:
      - Append the `StepResult` to `completedResults` in state.
      - Immediately call `updateExecutionStepResult` in Supabase. Do not batch this — persist every step result the moment it completes. This is the resume mechanism.
      - Set `stepStatuses[step.stepOrder] = 'success'`.

3. After all steps complete successfully:
   - Call `finalizeExecution` with `'success'`.
   - Set `executionStatus: 'success'`.
   - Set `isRunning: false`.
   - Set `currentStepOrder: null`.

**Important implementation note about wagmi hooks and dynamic execution:**

`useDeployContract` and `useWriteContract` from wagmi are React hooks and must be called at the top level of the hook, not inside loops or conditionals. Use wagmi's imperative `writeContractAsync` / `deployContractAsync` variants inside the execution loop. These return Promises and can be awaited safely within a loop. Design the hook accordingly.

**What this prompt produces:** The execution engine. No UI yet — this hook will be consumed by the Execution Progress component in Prompt 17.

---

### PROMPT 7 — Global Layout Shell & Navigation

**Objective:** Build the persistent application shell — the top navigation bar, the authenticated layout wrapper, and the shared page structure that all app pages live inside.

**Files to create:**
- `src/components/layout/AppNav.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/common/UserAvatar.tsx`
- `src/components/common/ConnectWalletButton.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(auth)/layout.tsx`

**`src/components/common/ConnectWalletButton.tsx`**

A client component that uses wagmi's `useConnect`, `useDisconnect`, and `useAccount` hooks. If no wallet is connected, renders a button labeled "Connect Wallet". On click, opens a small dropdown showing available connectors (MetaMask, injected wallet). If connected, renders the truncated wallet address (use `truncateAddress` from Prompt 5) with a disconnect option. Style as a secondary button variant.

**`src/components/layout/AppNav.tsx`**

Top navigation bar. Fixed at the top. Full width. Height: 56px. Background: `bg-card border-b border-border`. 

Left side: FlowForge logo (text-based if no icon asset exists — use `<span>Flow<span className="text-primary">Forge</span></span>` with the word "Flow" in muted color and "Forge" in primary color), followed by navigation links: "Recipes" (→ `/dashboard`) and "Pricing" (→ `/pricing`).

Right side: `ConnectWalletButton`.

Use `next/link` for navigation links. Mark active link with a subtle underline or slightly brighter text using Next.js `usePathname`.

**`src/components/layout/AppShell.tsx`**

A wrapper component that renders `<AppNav />` at the top and `{children}` below it in a `min-h-screen bg-background` container. The children area should have `pt-14` (to clear the fixed nav height of 56px) and `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8`.

**`src/app/(app)/layout.tsx`**

An authenticated route group layout. This layout must:
1. Use a Server Component to check if the user is authenticated via the Supabase server client.
2. If not authenticated, `redirect('/sign-in')`.
3. If authenticated, render `<AppShell>{children}</AppShell>`.

**`src/app/(auth)/layout.tsx`**

A minimal layout for auth screens. Centered vertically and horizontally. No nav bar. Dark background. Renders children inside a `max-w-sm mx-auto flex flex-col items-center justify-center min-h-screen` container.

**What this prompt produces:** The complete application shell. All subsequent page prompts will slot into this structure.

---

### PROMPT 8 — Landing Page

**Objective:** Build the public-facing landing page. This is a marketing page — it must communicate the value prop immediately, look premium, and convert visitors to sign-ups.

**File to create:**
- `src/app/page.tsx`

**Implementation specification:**

This is a Server Component. It does not have a `'use client'` directive. Any interactive elements (the CTA button that triggers wallet connect) should be extracted into a separate client component.

**Section 1 — Hero (above the fold)**

Two-column layout (`lg:grid-cols-2`) that collapses to single column on mobile.

Left column:
- A small badge/pill at the top: "OZ Defender shuts down July 1st, 2026" — styled in amber/warning color with a small dot icon. This is a conversion trigger.
- Headline (large, sharp, no gradients): "Build deployment workflows. Run them on any EVM chain."
- Sub-headline (muted text): "Define a sequence of contract deployments once. Reuse it across testnets and mainnet. No scripts, no copy-paste errors."
- Two CTA buttons: "Start Building Free" (primary, links to `/sign-in`) and "View a Demo Recipe" (ghost/outline, links to `/recipe/shared/demo` — this is a placeholder route that will be implemented in Prompt 15).
- Below CTAs: three small inline trust signals in a row — "No local setup", "Any EVM chain", "Variable passing".

Right column (hidden on mobile, visible `lg:block`):
- A static code-like card showing a mock recipe visualization. Not an animated component — a styled `div` that looks like a terminal or workflow card. Show three steps: "Step 1: Deploy Token → Status: ✓", "Step 2: Deploy Staking → Status: ✓", "Step 3: Grant Minter Role → Status: ◌ Running". Style with a dark card background, monospace font for addresses, and the "Running" step pulsing via CSS animation.

**Section 2 — Competitor Comparison Table**

A simple table with the following columns: Tool | Deploy Custom Contracts | Multi-Step Workflows | Variable Passing | GUI (No CLI) | Free to Start

Rows: FlowForge (✓ all columns), Remix IDE (✓/✗/✗/✓/✓), Thirdweb (✓/✗/✗/✓/✓), Hardhat Ignition (✓/✓/✓/✗/✓), OpenZeppelin Defender (✓/✓/✗/✓/✗ — mark as "Shutting Down").

Highlight the FlowForge row. Style the table with `border-border` borders and `bg-card` background.

**Section 3 — Three Value Props**

Three cards in a grid:
1. "No Local Setup" — "Connect your wallet and start building. No Node.js, no config files, no terminal."
2. "Variable Passing" — "Each step automatically receives the contract address from the previous step. No copy-paste."
3. "Share Recipes" — "Generate a link to your recipe. Your team runs the same workflow on any chain."

**Section 4 — CTA Strip**

Full-width dark card at the bottom: "Ready to stop writing deployment scripts?" with a single "Get Started Free" button.

**Footer:**
- One-line footer: "FlowForge by The Web3 Wizard · Built for EVM Developers"
- No heavy footer — this is a product tool, not a content site.

**Design notes:** Dark background throughout. No hero image. No gradients. Sharp, editorial feel. Monospace font for any code-adjacent text. Use `JetBrains Mono` or `Fira Code` via Google Fonts (add to `layout.tsx`) for code-style text.

---

### PROMPT 9 — Authentication Flow

**Objective:** Build the sign-in page and handle the post-authentication redirect.

**Files to create:**
- `src/app/(auth)/sign-in/page.tsx`
- `src/components/common/WalletSignIn.tsx`
- `src/app/api/auth/callback/route.ts`

**`src/app/(auth)/sign-in/page.tsx`**

A simple, centered page. Title: "Connect to FlowForge". Sub-title: "Connect your wallet to save and run recipes." Below: the `WalletSignIn` component. Below that: a small text link "No wallet? Learn more" pointing to a Metamask installation page in a new tab. No email sign-in option on this screen.

**`src/components/common/WalletSignIn.tsx`**

A client component. Uses wagmi's `useConnect` and `useAccount`. On click of "Connect Wallet" button, triggers the wallet connection flow. Once connected, uses Supabase's `createClient` and calls `signInWithOAuth` or — preferably — the SIWE (Sign-In with Ethereum) pattern using Supabase's custom auth flow:

For simplicity at launch, implement wallet-based auth as follows: After wallet connection, use Supabase's `signInAnonymously` and then link the wallet address to the user's metadata via `updateUser({ data: { wallet_address: address } })`. This is the simplest path to user identification without requiring a backend SIWE implementation. Note this in a code comment for future migration to full SIWE.

After successful auth, redirect to `/dashboard` using Next.js `useRouter`.

Handle and display errors: if wallet connection is rejected, show a toast (via sonner) with "Wallet connection was cancelled." If Supabase auth fails, show "Authentication failed. Please try again."

**`src/app/api/auth/callback/route.ts`**

Standard Supabase Auth callback handler using the `@supabase/ssr` pattern. Exchanges the auth code for a session.

---

### PROMPT 10 — My Recipes Dashboard

**Objective:** Build the main authenticated landing page — the recipes list with all management actions.

**Files to create:**
- `src/app/(app)/dashboard/page.tsx`
- `src/components/recipe/RecipeCard.tsx`
- `src/components/recipe/RecipeList.tsx`
- `src/components/recipe/CreateRecipeDialog.tsx`
- `src/components/recipe/DeleteRecipeDialog.tsx`

**`src/app/(app)/dashboard/page.tsx`**

A Server Component. Fetches all recipes for the current user using `getRecipesByUser` with the Supabase server client. Passes the data to `RecipeList`. 

Page header: left side has title "My Recipes" and a step count summary (`{count} recipes`). Right side has a "New Recipe" button that opens `CreateRecipeDialog`. 

If there are no recipes: render an empty state — a card with a centered illustration (use a `Code2` icon from lucide-react, large) and text "No recipes yet. Create your first deployment workflow." with a "Create Recipe" button.

**`src/components/recipe/RecipeCard.tsx`**

A client component card displaying a single recipe. Shows:
- Recipe name (bold, truncated at 1 line)
- Description (muted, truncated at 2 lines, or "No description" in italic muted text)
- Step count badge: `{N} steps`
- Last updated: formatted as a relative time (e.g., "2 days ago") — implement a simple `formatRelativeTime(dateString: string): string` utility in `src/utils/formatDate.ts`
- Action buttons in the top-right corner of the card: "Edit" (pencil icon → links to `/recipe/{id}/builder`) and "Delete" (trash icon → opens `DeleteRecipeDialog`)
- A "Run" button at the bottom of the card — primary style — links to `/recipe/{id}/run`

**`src/components/recipe/CreateRecipeDialog.tsx`**

A client component dialog. Form fields: "Recipe Name" (required, max 100 chars) and "Description" (optional, max 500 chars). On submit, calls `createRecipe` from the data access layer, then redirects to `/recipe/{newId}/builder` so the user immediately starts building. Use `react-hook-form` with a Zod schema for validation. Show a spinner on the submit button while saving.

**`src/components/recipe/DeleteRecipeDialog.tsx`**

A client component confirmation dialog. Shows "Delete '{recipeName}'?" with a warning: "This will permanently delete the recipe and all its execution history." Two buttons: "Cancel" and "Delete Recipe" (destructive red). On confirm, calls `deleteRecipe`, shows a success toast, and removes the recipe from the UI (use TanStack Query's `invalidateQueries` or optimistic updates).

---

### PROMPT 11 — Recipe Builder: Zustand Store & Validation

**Objective:** Build the Zustand store that manages the entire recipe builder's client-side state, and the Zod schemas used for step validation. This is the state layer before any UI.

**Files to create:**
- `src/stores/recipeBuilderStore.ts`
- `src/lib/validation/recipeSchemas.ts`

**`src/lib/validation/recipeSchemas.ts`**

Define Zod schemas for:
- `stepParamConfigSchema`: validates a `StepParamConfig` object. If `isVariable` is true, `variableRef` must be a non-empty string. If `isVariable` is false, `value` is required (but can be empty string — some optional params may be empty).
- `deployStepSchema`: validates a deploy step — `label` required and non-empty, `abi` must be a non-empty array, `bytecode` must be a non-empty string starting with `0x`, `constructorParams` must be an array of `stepParamConfigSchema`.
- `interactStepSchema`: validates an interact step — `label` required, `abi` required, `functionName` required, `targetAddress` required (either a valid address pattern OR a variable ref pattern `${step_N.contractAddress}`), `constructorParams` required.
- `recipeMetaSchema`: `{ name: z.string().min(1).max(100), description: z.string().max(500).optional() }`

**`src/stores/recipeBuilderStore.ts`**

A Zustand store managing the following state and actions:

**State shape:**
```
{
  recipeId: string | null
  recipeName: string
  recipeDescription: string
  isPublic: boolean
  steps: RecipeStep[]
  selectedStepId: string | null
  isDirty: boolean          // true when unsaved changes exist
  isSaving: boolean
  lastSavedAt: Date | null
}
```

**Actions:**
- `initializeBuilder(recipe: RecipeWithSteps)` — loads an existing recipe into the store
- `setRecipeName(name: string)` — updates name, sets `isDirty: true`
- `setRecipeDescription(desc: string)` — updates description, sets `isDirty: true`
- `setIsPublic(value: boolean)` — updates public flag, sets `isDirty: true`
- `addStep(stepType: StepType)` — appends a new empty step of the given type to the end. New step gets `stepOrder` equal to current `steps.length`, a generated temporary ID (prefix `temp_` + uuid), and default empty values. Automatically selects the new step by setting `selectedStepId`.
- `removeStep(stepId: string)` — removes the step, recalculates `stepOrder` for all remaining steps to be contiguous, clears `selectedStepId` if the deleted step was selected.
- `reorderSteps(newOrder: string[])` — accepts an array of step IDs in the new order and reassigns `stepOrder` values (0, 1, 2...).
- `selectStep(stepId: string | null)` — sets `selectedStepId`.
- `updateStepField<K extends keyof RecipeStep>(stepId: string, field: K, value: RecipeStep[K])` — updates any field on a specific step. Sets `isDirty: true`. This is the generic step update action used by both the Deploy and Interact config panels.
- `updateStepParam(stepId: string, paramIndex: number, updates: Partial<StepParamConfig>)` — updates a single parameter within a step's `constructorParams` array at the given index.
- `setSaving(value: boolean)` — sets `isSaving` flag.
- `markSaved()` — sets `isDirty: false`, `isSaving: false`, `lastSavedAt: new Date()`.

**Computed getters (using Zustand's `get()`):**
- `getSelectedStep(): RecipeStep | null` — returns the step matching `selectedStepId`
- `getStepsBeforeSelected(): RecipeStep[]` — returns all steps with `stepOrder < selectedStep.stepOrder`, used to populate variable dropdowns

---

### PROMPT 12 — Recipe Builder: Page & Step List Panel

**Objective:** Build the recipe builder page layout, the left-panel step list, and the drag-and-drop reorder functionality.

**Files to create:**
- `src/app/(app)/recipe/[id]/builder/page.tsx`
- `src/components/builder/BuilderPage.tsx`
- `src/components/builder/StepList.tsx`
- `src/components/builder/StepListItem.tsx`
- `src/components/builder/AddStepButton.tsx`
- `src/components/builder/BuilderToolbar.tsx`

**`src/app/(app)/recipe/[id]/builder/page.tsx`**

A Server Component. Fetches the recipe with steps using `getRecipeWithSteps` with the server Supabase client. If the recipe is not found or the user doesn't own it, `notFound()`. Passes the recipe data to `BuilderPage`.

**`src/components/builder/BuilderPage.tsx`**

A client component. On mount, calls `initializeBuilder(recipe)` from the Zustand store to load the recipe. Sets up an interval or focus event to auto-save every 30 seconds when `isDirty` is true.

The save function: calls `updateRecipe` for the meta fields (name, description, isPublic) if they changed, then calls `upsertSteps` with all current steps from the store. On success, calls `markSaved()`. On error, shows a toast.

Renders:
- `<BuilderToolbar />` at the top
- A two-panel layout below: `<StepList />` on the left (fixed width, ~280px), step config panel on the right (fills remaining space, renders either `<DeployStepConfig />` or `<InteractStepConfig />` based on `selectedStep.stepType`)

**`src/components/builder/BuilderToolbar.tsx`**

Displays: recipe name (editable inline — clicking it turns into an input), save status ("Saved" with checkmark, or "Unsaved changes" with dot), a "Share" toggle button (for setting `isPublic`), a "Run Recipe" button (primary, links to `/recipe/{id}/run`), and a back arrow to `/dashboard`.

Auto-updates the store's `recipeName` as the user types in the inline name editor.

**`src/components/builder/StepList.tsx`**

Left panel. Uses `@dnd-kit/sortable` to make the step list drag-and-drop reorderable. On drag end, calls `reorderSteps` in the store with the new order. Renders a `<StepListItem />` for each step. Has an `<AddStepButton />` at the bottom.

**`src/components/builder/StepListItem.tsx`**

Renders a single step in the list. Shows: drag handle (grip icon), step number (1-indexed: `step.stepOrder + 1`), step label, step type badge ("DEPLOY" in blue / "INTERACT" in amber). Clicking selects the step. Highlighted differently when it is the selected step. Has a small delete button (x icon) that calls `removeStep`.

**`src/components/builder/AddStepButton.tsx`**

A button that opens a small popover/dropdown offering two options: "Deploy Contract" and "Interact with Contract". Selecting one calls `addStep('deploy')` or `addStep('interact')`.

---

### PROMPT 13 — Recipe Builder: Deploy Step Configuration Panel

**Objective:** Build the right-panel configuration form for "deploy" type steps.

**Files to create:**
- `src/components/builder/DeployStepConfig.tsx`
- `src/components/builder/AbiUploader.tsx`
- `src/components/builder/ParamConfigurator.tsx`
- `src/components/builder/VariablePicker.tsx`

**`src/components/builder/AbiUploader.tsx`**

A reusable component for ABI input. Provides two methods:
1. A file upload button that accepts `.json` files. On file select, reads the file content and parses it using `parseAbi` from the ABI parser.
2. A textarea for pasting ABI JSON directly.

On successful parse, calls a provided `onAbiParsed(abi: ParsedAbi)` callback. On parse failure, shows an inline error message (not a toast — inline below the input) with the `AbiParseError` message.

**`src/components/builder/VariablePicker.tsx`**

A reusable dropdown component. Props: `{ value: string | null; onChange: (value: string) => void; availableVariables: Array<{ label: string; value: string }> }`.

Renders a `Select` component (from shadcn/ui) populated with the available variables. Shows a placeholder "Select a previous step's output" when no value is selected. If `availableVariables` is empty, shows a disabled select with text "No previous steps available".

**`src/components/builder/ParamConfigurator.tsx`**

A reusable component for configuring a list of parameters. Props: `{ params: StepParamConfig[]; onChange: (index: number, updates: Partial<StepParamConfig>) => void; availableVariables: Array<{ label: string; value: string }> }`.

For each param, renders a row containing:
- Param name label (from `param.name`) and type label (from `param.type`) in muted text
- A toggle switch labeled "Use Variable" that toggles `isVariable`
- If `isVariable === false`: a text input bound to `param.value`
- If `isVariable === true`: a `<VariablePicker />` component for selecting the variable reference

**`src/components/builder/DeployStepConfig.tsx`**

The full right-panel form for a deploy step. Reads the selected step from the Zustand store. Dispatches updates via `updateStepField` and `updateStepParam`.

Contains:
1. "Step Label" input — updates `step.label`
2. "Contract Name" input (optional) — updates `step.contractName`
3. "ABI" section using `<AbiUploader />` — on ABI parsed, calls `updateStepField(stepId, 'abi', parsedAbi)` AND rebuilds the `constructorParams` by calling `buildDefaultParams(getConstructorInputs(parsedAbi))` and calling `updateStepField(stepId, 'constructorParams', newParams)`. Important: rebuilding params clears any existing param values and variable references — this is expected.
4. "Bytecode" textarea — updates `step.bytecode`. Shows a small helper text: "Paste the compiled contract bytecode (0x...)".
5. "Constructor Parameters" section using `<ParamConfigurator />` — available variables are computed from `getStepsBeforeSelected()` and `getAvailableVariables()` from Prompt 5.

If the step has no ABI uploaded yet, the Constructor Parameters section shows: "Upload an ABI to configure constructor parameters."

If the ABI has a constructor with zero inputs (no params), show: "This contract has no constructor parameters."

---

### PROMPT 14 — Recipe Builder: Interact Step Configuration Panel

**Objective:** Build the right-panel configuration form for "interact" type steps.

**Files to create:**
- `src/components/builder/InteractStepConfig.tsx`
- `src/components/builder/FunctionSelector.tsx`

**`src/components/builder/FunctionSelector.tsx`**

A component that renders a `Select` dropdown populated with the results of `getWriteFunctions(abi)`. Each option shows the function name and a parenthesized parameter count (e.g., `setMinter (1 param)`). On selection change, calls `onFunctionSelected(functionName: string)`. If no ABI is uploaded, renders a disabled select with "Upload an ABI first."

**`src/components/builder/InteractStepConfig.tsx`**

The full right-panel form for an interact step. Contains:

1. "Step Label" input — updates `step.label`
2. "Target Contract Address" section:
   - A toggle at the top: "Use fixed address" vs "Use step output"
   - If "Use fixed address": shows a text input for the address. Updates `step.targetAddress`. Validates the input against `isAddress()` with an inline error if invalid.
   - If "Use step output": shows a `<VariablePicker />` to select a `contractAddress` from a previous deploy step. Updates `step.targetAddress` with the variable ref string (e.g., `${step_0.contractAddress}`).
3. "ABI" section using `<AbiUploader />` — same behavior as in DeployStepConfig. On ABI parse, calls `updateStepField(stepId, 'abi', parsedAbi)` and clears `functionName` and `constructorParams`.
4. "Function" section using `<FunctionSelector />` — on function selection, calls `updateStepField(stepId, 'functionName', name)` AND rebuilds `constructorParams` using `buildDefaultParams(getFunctionByName(abi, selectedFunctionName)?.inputs ?? [])`.
5. "Function Parameters" using `<ParamConfigurator />` — same as deploy step panel.

---

### PROMPT 15 — Recipe Save, Share & Public View

**Objective:** Complete the recipe sharing feature — shareable public URLs for recipes and a read-only public view page.

**Files to create:**
- `src/app/(app)/recipe/[id]/builder/actions.ts`
- `src/components/builder/ShareRecipeButton.tsx`
- `src/app/recipe/shared/[id]/page.tsx`
- `src/components/recipe/PublicRecipeView.tsx`

**`src/app/(app)/recipe/[id]/builder/actions.ts`**

Server Actions file for the builder page. Create one action:
- `saveRecipeAction(recipeId: string, meta: UpdateRecipePayload, steps: UpsertStepPayload[])` — a Server Action that:
  1. Gets the authenticated user from Supabase server client
  2. Verifies the recipe belongs to the user
  3. Calls `updateRecipe` for meta
  4. Calls `upsertSteps` for all steps, passing the full array (this replaces the entire step list)
  5. Returns `{ success: true }` or `{ success: false, error: string }`

Also create:
- `togglePublicAction(recipeId: string, isPublic: boolean)` — toggles the recipe's `is_public` field.

**`src/components/builder/ShareRecipeButton.tsx`**

A client component in the builder toolbar. Shows a share icon button. When the recipe's `isPublic` is `false`, clicking it first confirms with a popover: "Make this recipe publicly viewable? Anyone with the link can view and copy it." with a "Make Public" button. On confirm, calls `togglePublicAction`, then shows the shareable URL in a copy-to-clipboard input: `{NEXT_PUBLIC_APP_URL}/recipe/shared/{recipeId}`. When `isPublic` is already `true`, shows the URL immediately with a "Make Private" option.

**`src/app/recipe/shared/[id]/page.tsx`**

A public, unauthenticated Server Component page. Calls `getRecipeWithSteps` — this works because RLS allows reading `is_public = true` recipes without auth. If the recipe is not found or `is_public` is false, `notFound()`. Renders `<PublicRecipeView />`.

**`src/components/recipe/PublicRecipeView.tsx`**

A read-only recipe display. Shows:
- Recipe name and description
- "Created by [wallet address truncated]" (from `userId` — not shown if no wallet is linked)
- An ordered list of all steps: step number, label, type badge, and a summary of the contract name/function name
- A "Copy Recipe" button — when clicked, if the user is authenticated, it clones the recipe into their account via a `cloneRecipeAction` Server Action and redirects them to the builder for the new copy. If not authenticated, redirects to sign-in with a return URL.
- A "Use as Template" label under the recipe name

Also handle the demo recipe URL: if `id === 'demo'`, render a hardcoded demo recipe using the first static template from `src/config/starterTemplates.ts` (implemented in Prompt 19).

---

### PROMPT 16 — Run Modal & Chain Selection

**Objective:** Build the chain selection modal that appears when a user clicks "Run Recipe" and initiates the execution.

**Files to create:**
- `src/app/(app)/recipe/[id]/run/page.tsx`
- `src/components/execution/RunModal.tsx`
- `src/components/execution/ChainSelector.tsx`

**`src/app/(app)/recipe/[id]/run/page.tsx`**

A Server Component that fetches the recipe with steps. If not found or not owned by user, `notFound()`. Renders `<RunModal recipe={recipe} />`.

**`src/components/execution/ChainSelector.tsx`**

A client component that renders a list of available chains from `SUPPORTED_CHAINS`. Each chain renders as a selectable card showing the chain name, short name badge, and "TESTNET" pill if `isTestnet`. The currently selected chain is highlighted with a border.

Below the chain list, if a mainnet chain is selected, show a warning box: "⚠ Mainnet Deployment — This will execute real transactions. Gas fees will be charged to your connected wallet. Double-check all parameters before proceeding."

Emits `onChainSelect(chain: SupportedChain)`.

**`src/components/execution/RunModal.tsx`**

A client component shown as a full-page overlay (not a small modal). Lifecycle has two stages:

**Stage 1 — Chain Selection:**
- Title: "Run Recipe: {recipe.name}"
- Description: "Select the target chain for this deployment"
- `<ChainSelector />` component
- Below: a read-only summary of the steps (names and types only — no config details)
- A "Confirm & Execute" button — disabled until a chain is selected. On click, transitions to Stage 2.

**Stage 2 — Execution:**
- Immediately calls `executeRecipe()` from `useRecipeExecution` on mount of Stage 2.
- Renders the execution progress UI (the full `<ExecutionProgress />` component from Prompt 17).

---

### PROMPT 17 — Execution Progress UI

**Objective:** Build the real-time step-by-step execution progress display — the most important feedback surface in the product.

**Files to create:**
- `src/components/execution/ExecutionProgress.tsx`
- `src/components/execution/StepProgressCard.tsx`
- `src/components/execution/ExecutionSummary.tsx`

**`src/components/execution/StepProgressCard.tsx`**

A component for a single step's progress card. Props: `{ step: RecipeStep; result: StepResult | null; status: StepStatus; chain: SupportedChain }`.

Visual states:
- `pending`: Grey, step number, step label, type badge. Muted appearance.
- `running`: Amber border, pulsing dot animation next to step label, "Waiting for wallet confirmation..." sub-text.
- `success`: Green border, green checkmark icon. Below the label: contract address (for deploy steps) as a `truncateAddress()` display with a copy-to-clipboard icon AND a link-out icon to the block explorer (using `getExplorerAddressUrl`). Transaction hash with the same treatment using `getExplorerTxUrl`. 
- `failed`: Red border, red x icon. Below the label: the formatted error message in red muted text.

**`src/components/execution/ExecutionSummary.tsx`**

The summary screen shown after execution completes (success or partial/failed). Shows:

On success:
- Large green checkmark
- "Deployment Complete" heading
- A copy-to-clipboard text area containing all deployed contract addresses formatted as a clean list: `{stepLabel}: {contractAddress}` per line
- "Copy All Addresses" button
- "View Execution History" button
- "Run Again" button

On partial or failed:
- Red warning icon
- "Deployment Stopped at Step {N}" heading
- Error message in a styled error box
- "Retry from Step {N}" button — links back to the run page with a query param `?resumeFrom={stepOrder}` (full resume is a v2 feature — for now, show the button but it re-runs the entire recipe; add a comment noting the resume feature path)
- "View Execution History" button

**`src/components/execution/ExecutionProgress.tsx`**

The top-level execution progress component. Receives `{ recipe, chain }` as props and uses `useRecipeExecution(recipe, chain)` to get all execution state.

Renders:
- Page title and chain badge at the top
- An ordered list of `<StepProgressCard />` components for each step, updated in real-time as the hook's state changes
- When `executionStatus` transitions to `'success'` or `'partial'` or `'failed'`, renders `<ExecutionSummary />` below the step list

The list uses React's key-based reconciliation — key each `StepProgressCard` by `step.id` so they update in place without remounting.

---

### PROMPT 18 — Execution History Page

**Objective:** Build the execution history view for a recipe.

**Files to create:**
- `src/app/(app)/recipe/[id]/history/page.tsx`
- `src/components/execution/ExecutionHistoryList.tsx`
- `src/components/execution/ExecutionHistoryRow.tsx`
- `src/components/execution/ExecutionDetailView.tsx`

**`src/app/(app)/recipe/[id]/history/page.tsx`**

Server Component. Fetches recipe + all executions via `getExecutionsByRecipe`. Renders the page with title "Execution History — {recipe.name}" and a back link to the builder. Renders `<ExecutionHistoryList />`.

**`src/components/execution/ExecutionHistoryList.tsx`**

Renders a table. Columns: Date, Chain, Status, Steps Completed, Actions. Each row is an `<ExecutionHistoryRow />`. If no executions, show empty state: "No executions yet. Run your recipe to see history here."

**`src/components/execution/ExecutionHistoryRow.tsx`**

One row in the history table. Shows: relative date (e.g., "3 hours ago"), chain name with a badge, status badge (color-coded: green for success, red for failed, amber for partial), steps completed as `{completedCount}/{totalCount}`, and a "View Details" button.

**`src/components/execution/ExecutionDetailView.tsx`**

A sheet/drawer that opens when "View Details" is clicked. Shows the full step result breakdown — same visual as `StepProgressCard` but read-only. Also shows a "Export CSV" button. 

The CSV export: generates a CSV in-memory with columns: Step Number, Step Label, Status, Contract Address, Transaction Hash, Completed At. Uses the `Blob` and `URL.createObjectURL` pattern to trigger a download. The filename should be `{recipe.name}_{execution.chainName}_{executionDate}.csv`.

---

### PROMPT 19 — Static Starter Templates

**Objective:** Build the static starter template system — 6 pre-built recipe configurations that users can load as starting points.

**Files to create:**
- `src/config/starterTemplates.ts`
- `src/components/recipe/StarterTemplateGallery.tsx`

**`src/config/starterTemplates.ts`**

Define and export a `STARTER_TEMPLATES` array of type `Array<{ id: string; name: string; description: string; category: string; steps: Omit<RecipeStep, 'id' | 'recipeId'>[] }>`.

Include the following 6 templates. Each template's steps contain realistic (but simplified) ABI arrays — use minimal ABIs with just the constructor or function needed, not full production ABIs:

1. **ERC-20 Token + Staking System** — 3 steps: Deploy ERC20 token (constructor: name, symbol, initialSupply), Deploy Staking contract (constructor: tokenAddress using `step_0.contractAddress`), Call `setStakingContract(address)` on Token using `step_1.contractAddress`.

2. **Ownable Token + Ownership Transfer** — 2 steps: Deploy Ownable ERC20 token, Call `transferOwnership(newOwner)` on the token.

3. **Token + Vesting Contract** — 2 steps: Deploy ERC20 token, Deploy Vesting contract with tokenAddress from step 0.

4. **ERC-721 NFT Collection** — 1 step: Deploy ERC721 contract (constructor: name, symbol, baseURI).

5. **Minimal Proxy Factory** — 2 steps: Deploy implementation contract, Deploy factory with implementation address from step 0.

6. **DAO: Token + Governor** — 3 steps: Deploy ERC20Votes token, Deploy TimelockController, Deploy Governor contract with token and timelock addresses from steps 0 and 1.

For each template step, use a realistic ABI fragment that only contains the constructor or the specific function needed. Do not use full OpenZeppelin ABI dumps — keep each ABI array to only the entries needed for the step to function.

**`src/components/recipe/StarterTemplateGallery.tsx`**

A component that renders the 6 templates in a grid of cards. Each card shows: template name, description, category badge, step count. A "Use Template" button loads the template by calling a `loadTemplate(template)` action — this creates a new recipe in Supabase named after the template and pre-populates its steps, then redirects to the builder.

This gallery should be accessible from the empty state of the Dashboard page (add a "Start from a Template" section below the empty state CTA).

---

### PROMPT 20 — Pricing Page & Lemon Squeezy Integration

**Objective:** Build the pricing page with three tiers and wire up Lemon Squeezy checkout links.

**Files to create:**
- `src/app/pricing/page.tsx`
- `src/components/pricing/PricingCard.tsx`
- `src/components/pricing/BillingToggle.tsx`
- `src/app/api/webhooks/lemon-squeezy/route.ts`
- `src/lib/lemonsqueezy.ts`

**`src/lib/lemonsqueezy.ts`**

Server-only utility. Exports:
- `createCheckoutUrl(variantId: string, userEmail?: string): Promise<string>` — calls the Lemon Squeezy API to create a checkout session and returns the checkout URL.
- `verifyWebhookSignature(payload: string, signature: string): boolean` — verifies the HMAC signature of incoming webhooks using `LEMON_SQUEEZY_WEBHOOK_SECRET`.

**`src/app/pricing/page.tsx`**

Server Component. Renders the full pricing page.

Page header: "Simple, Transparent Pricing" + a `<BillingToggle />` (Monthly / Annual) that uses a URL search param `?billing=annual` to toggle. The annual discount is 20%.

Below: three `<PricingCard />` components side by side. The Builder tier should be visually highlighted as "Most Popular" with a subtle border accent.

Below the cards: a simple FAQ section with 4–5 questions (hardcoded text):
- "Can I use FlowForge on mainnet with the free plan?" (No, free is testnet only)
- "What chains are supported?" (List the 9 chains)  
- "What happens if my execution fails mid-recipe?" (Explain partial execution and history)
- "Can I cancel anytime?" (Yes, cancel from your account, access until end of billing period)

**`src/components/pricing/PricingCard.tsx`**

Props: `{ tier: 'free' | 'builder' | 'team'; billingCycle: 'monthly' | 'annual'; isHighlighted?: boolean }`

Display pricing as defined in Revive.md Section 3.6:
- Free: $0, 3 recipes, testnet only, no sharing — CTA: "Start Free"
- Builder: $49/month ($39/month annual) — CTA: "Get Builder" (links to Lemon Squeezy checkout via a Server Action)
- Team: $99/month ($79/month annual) — CTA: "Get Team" (same)

Feature list for each tier as bullet points. A checkmark icon for included features, an x icon for excluded ones. Be specific — list the exact limits from Revive.md.

**`src/components/pricing/BillingToggle.tsx`**

A client component with two buttons: "Monthly" and "Annual" with a "Save 20%" badge next to Annual. Updates the URL search param on click.

**`src/app/api/webhooks/lemon-squeezy/route.ts`**

A POST route handler. Verifies the webhook signature using `verifyWebhookSignature`. Handles the `order_created` and `subscription_created` event types. On a successful subscription event, updates the user's metadata in Supabase (set `plan: 'builder'` or `plan: 'team'` based on the variant ID) using the Supabase admin client. Returns `200 OK` on success, `401` on signature verification failure.

---

### PROMPT 21 — Edge Case Hardening & Final Validation

**Objective:** Systematic hardening pass across the entire codebase. No new features — only fixing gaps, adding missing validations, and ensuring every state is handled.

**Files to modify:** Potentially any file created in Prompts 0–20. This prompt is a review and patch pass.

**Checklist to execute — address every item:**

**Authentication Edge Cases:**
- [ ] If a user tries to navigate to `/dashboard` when not signed in, verify the redirect to `/sign-in` fires correctly. Test that the `(app)` route group layout Server Component redirect works.
- [ ] If a user is signed in but their Supabase session has expired, verify the middleware refreshes it or redirects to sign-in.

**Recipe Builder Edge Cases:**
- [ ] What if a user tries to run a recipe with zero steps? The "Run Recipe" button should be disabled and show a tooltip: "Add at least one step before running."
- [ ] What if a user uploads an invalid JSON file as an ABI? The `AbiUploader` must show an inline error and not crash.
- [ ] What if a user tries to use a variable from step 3 in step 2? The `getAvailableVariables` function only returns steps with lower `stepOrder` — verify the UI reflects this correctly.
- [ ] What if the recipe name is blank when the user tries to save? The toolbar's inline name editor must validate and show an error state.
- [ ] What if a Deploy step has a bytecode field that doesn't start with `0x`? Add a validation check in the step config panel and show an inline error.
- [ ] What if the user reorders steps in a way that breaks a variable reference? (e.g., step 3 references step 2's output, but step 3 is moved before step 2). After reorder, re-validate all steps that use variable references and mark any broken references with a warning indicator on the step list item. Do not auto-fix — show a visual warning.

**Execution Edge Cases:**
- [ ] What if the user disconnects their wallet mid-execution? The execution hook must detect the disconnect via wagmi's `useAccount` and halt the execution, finalizing with `'partial'` status.
- [ ] What if `updateExecutionStepResult` in Supabase fails during execution? Log the error to the console but do NOT halt the execution. Supabase persistence is best-effort — the UI state continues even if the DB write fails.
- [ ] What if the user navigates away from the execution progress page mid-run? The hook is destroyed. On returning, the user can see the partial execution history from the database. Add a comment in `useRecipeExecution.ts` noting this limitation and the path to solve it (background execution via a service worker is v2 scope).

**UI/UX Completeness:**
- [ ] Every page that fetches data from Supabase must have a loading skeleton. Use shadcn/ui `<Skeleton />` components. Dashboard, Builder, History pages all need skeleton states while data loads.
- [ ] Every page that fetches data must handle the case where Supabase returns an error. Show an error card: "Failed to load data. Please refresh the page."
- [ ] The `ConnectWalletButton` in the navbar must show a loading state while the wallet connection is in progress.
- [ ] On mobile (< 768px), the builder's two-panel layout should stack vertically: step list first, config panel below. Use responsive Tailwind classes (`md:grid-cols-[280px_1fr]` collapsing to single column).

**Performance:**
- [ ] Verify that TanStack Query is used for all data fetching in client components. No `useEffect` + `fetch` anti-patterns.
- [ ] The `SUPPORTED_CHAINS` array is static — mark it with `as const` and ensure it is not re-computed on every render.
- [ ] The `parseAbi` function can be slow on large ABIs. Wrap it in a `useMemo` inside `AbiUploader` if it's called inside a React component render cycle.

---

### PROMPT FINAL — Production Hardening & Deployment Readiness

**Objective:** Prepare the application for Vercel production deployment. Security review, environment validation, and final checklist.

**Files to create/modify:**
- `src/lib/env.ts` (new — runtime environment validation)
- `vercel.json` (new)
- `src/app/robots.ts` (new)
- `src/app/sitemap.ts` (new)

**`src/lib/env.ts`**

Using Zod, define a schema for all required environment variables. On module load, validate `process.env` against the schema. If any required variable is missing or malformed, throw an error with a clear message listing which variable is missing. This file is imported at the top of the Supabase server client, so any misconfigured deployment fails loudly at startup rather than silently at runtime.

Required env vars to validate:
- `NEXT_PUBLIC_SUPABASE_URL` — must be a valid URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — must be a non-empty string
- `NEXT_PUBLIC_APP_URL` — must be a valid URL
- `LEMON_SQUEEZY_API_KEY` — non-empty string (server-only, validated in the Lemon Squeezy lib, not here)
- `LEMON_SQUEEZY_WEBHOOK_SECRET` — non-empty string (server-only)

**`vercel.json`**

Configure:
- `framework: "nextjs"`
- Set the webhook route to skip Vercel's default body parsing: add a `functions` entry for `src/app/api/webhooks/lemon-squeezy/route.ts` with `maxDuration: 10`.
- Set security headers via `headers` config: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.

**`src/app/robots.ts`**

Generate a robots.txt via the Next.js Metadata API. Allow all bots to crawl the public pages (`/`, `/pricing`, `/recipe/shared/*`). Disallow `/dashboard`, `/api/*`, and `/recipe/*/builder`.

**`src/app/sitemap.ts`**

A dynamic sitemap using the Next.js Metadata API. Include static routes: `/`, `/pricing`. Dynamically fetch all `is_public = true` recipes from Supabase (server-side, with error handling — if Supabase fails, return only the static routes) and add their `/recipe/shared/{id}` URLs with `changeFrequency: 'weekly'`.

**Final Checklist — Execute Each Item:**

**Supabase Production Setup:**
- [ ] In the Supabase dashboard, confirm all three tables exist with the correct schema from `database/schema.sql`
- [ ] Confirm RLS is enabled on all three tables
- [ ] Confirm all five RLS policies exist for `recipes`
- [ ] Confirm the `updated_at` trigger exists on `recipes`
- [ ] In Supabase Auth settings, add the production domain to "Allowed Redirect URLs"
- [ ] In Supabase Auth settings, confirm "Enable Email Confirmations" behavior matches your intended auth flow

**Vercel Deployment:**
- [ ] All six environment variables from `.env.example` are set in Vercel's Environment Variables settings for the Production environment
- [ ] `NEXT_PUBLIC_APP_URL` is set to the actual production URL (not localhost)
- [ ] The Lemon Squeezy webhook URL is set to `{NEXT_PUBLIC_APP_URL}/api/webhooks/lemon-squeezy` in the Lemon Squeezy dashboard
- [ ] Run `npm run build` locally and confirm zero TypeScript errors and zero build errors before pushing to production

**Browser Testing — Manual Verification:**
- [ ] Connect wallet → redirected to dashboard
- [ ] Create a new recipe → builder opens
- [ ] Add a deploy step, upload a simple ERC20 ABI and bytecode, run on Sepolia → execution completes, contract address appears
- [ ] Add a second step referencing the first step's contract address as a variable → variable resolves correctly during execution
- [ ] Share a recipe → public URL opens without authentication and shows the recipe
- [ ] Check the pricing page → all three tiers display with correct prices for monthly and annual
- [ ] Verify the site loads in under 3 seconds on a standard connection (check Vercel Analytics)

**Security Final Check:**
- [ ] Verify that no private environment variables (LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_WEBHOOK_SECRET) are prefixed with `NEXT_PUBLIC_` — they must never be exposed to the browser
- [ ] Verify the Lemon Squeezy webhook handler returns `401` (not a detailed error) when signature verification fails
- [ ] Verify that all Supabase queries in Server Components use the server client (not the browser client)
- [ ] Review `database/schema.sql` one final time and confirm every table has RLS enabled and every policy is correctly scoped

---

*End of Agent.md — Phase 2 Execution Roadmap*  
*22 Prompts (Prompt Zero through Prompt Final)*  
*Reference document: Revive.md (must be in workspace root)*  
*Tech stack: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, wagmi v2, viem, Zustand, TanStack Query v5, Supabase, Lemon Squeezy*
