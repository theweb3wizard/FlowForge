# FlowForge — Comprehensive Technical Documentation

**Version:** 5.0
**Status:** Production Ready

---

## Executive Summary

This document provides a complete architectural and technical overview of the FlowForge platform. It is intended for developers, architects, and technical stakeholders.

FlowForge has evolved from a simple MVP into a robust, multi-user, and production-ready platform. This evolution was driven by critical improvements to the **database architecture**, **security model**, and **data-fetching patterns**. The system is now designed to be scalable, maintainable, and secure, providing a solid foundation for future feature development.

### Key Architectural Pillars
1.  **Unified Data Model**: A `VIEW`-based approach unifies public and private templates, enabling a scalable and flexible template system.
2.  **Server-Side Authentication**: A backend-for-frontend (BFF) authentication pattern using JWTs secures all database interactions and enables true multi-tenancy.
3.  **Robust Data Integrity**: A combination of database constraints and application-level checks prevents data corruption and orphaned records.
4.  **Performant by Design**: Strategic database indexing and efficient query patterns ensure the application remains fast and responsive as data volume grows.

---

## 1. Technical Architecture Deep Dive

### 1.1. System Architecture

FlowForge follows a modern web architecture, separating frontend presentation from backend services and blockchain interactions.

```
+--------------------------+      +-------------------------+      +----------------------+
|      User's Browser      |      |     Next.js Server      |      |    External Services   |
+--------------------------+      +-------------------------+      +----------------------+
|                          |      |                         |      |                      |
|  [Next.js React Frontend]<----->|   [API Routes / BFF]    |      | [Supabase PostgreSQL]  |
|      (shadcn/ui)         |      | (/api/auth/wallet)      |      |   (RLS Enabled)      |
|                          |      +-------------------------+      +----------------------+
|  [wagmi / ethers.js]     |                                       |                      |
|           |              |                                       | [BlockDAG Network]   |
|           |              |                                       |      (EVM)           |
|           v              |                                       +----------------------+
|  [Wallet (MetaMask)]   |
|                          |
+--------------------------+
```

1.  **Frontend**: A Next.js application serves the React frontend. `shadcn/ui` and `Tailwind CSS` are used for the design system. `TanStack Query` manages all server state.
2.  **Backend (BFF)**: A Next.js API route (`/api/auth/wallet`) acts as a secure backend-for-frontend. Its sole responsibility is to verify a user's wallet address and issue a signed JWT for Supabase authentication.
3.  **Database**: Supabase provides the PostgreSQL database, authentication services, and real-time capabilities. All tables containing user data are protected by Row Level Security (RLS).
4.  **Blockchain**: Client-side libraries (`wagmi`, `ethers.js`) interact directly with a user's wallet (e.g., MetaMask) to sign and send transactions to an EVM-compatible network like BlockDAG.

### 1.2. Database Architecture

The database schema is designed for security, data integrity, and performance.

#### Tables
-   `contract_templates`
    -   **Purpose**: Stores the curated list of public, pre-audited smart contract templates available to all users.
    -   **RLS**: `SELECT` access is public; `INSERT`/`UPDATE`/`DELETE` is restricted to admins.
-   `user_contract_templates`
    -   **Purpose**: Stores private templates created by individual users. This is a multi-tenant table.
    -   **RLS**: Enabled. Users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where `creator_address` matches their authenticated wallet address.
-   `recipes`
    -   **Purpose**: Stores user-created multi-step workflows. Can be private or public.
    -   **RLS**: Enabled. Users can read their own private recipes or any public recipe. Write access is restricted to the creator.
-   `deployments`
    -   **Purpose**: Records every contract deployment made through the platform.
    -   **RLS**: `SELECT` is public to populate the "All Deployments" dashboard. `INSERT` is allowed for any authenticated user.
-   `recipe_executions`
    -   **Purpose**: Logs every run of a recipe, including the status of each step.
    -   **RLS**: Enabled. Users can only access execution records they initiated.

#### The Template System Architecture: A Key Evolution

The most critical architectural decision was how to handle public vs. private templates.

1.  **Initial Problem**: A single `contract_templates` table could not securely support user-created templates without complex RLS policies and potential data leaks.
2.  **Solution**: Two distinct tables were created: `contract_templates` for public assets and `user_contract_templates` for private ones.
3.  **The `all_templates` VIEW**: To provide a unified interface for the application to query all templates, a database `VIEW` was created.

    ```sql
    -- This VIEW combines public and user templates into a single, queryable source.
    CREATE OR REPLACE VIEW public.all_templates AS
    SELECT
      id, name, description, icon, abi, bytecode, parameters, created_at,
      'public' AS source_table,  -- Add a column to identify the source
      NULL::text AS creator_address -- Public templates have no creator
    FROM public.contract_templates
    UNION ALL
    SELECT
      id, name, description, icon, abi, bytecode, parameters, created_at,
      'user' AS source_table,
      creator_address
    FROM public.user_contract_templates;
    ```
    This design is highly scalable and maintains a clean separation of data at the storage layer.

### 1.3. Data Fetching Strategy

The application uses `TanStack Query` to manage all data fetching, which provides robust caching, re-fetching, and state management. Due to the use of the `all_templates` VIEW (which does not have a foreign key), we cannot rely on Supabase's automatic PostgREST joins.

Instead, a more explicit and reliable two-step fetch pattern is used for fetching related data:

```typescript
// Example: How deployments with their templates are fetched
// File: src/lib/supabase/deployments.ts

// 1. Fetch a paginated list of deployments.
const { data: deployments, error } = await supabase
  .from('deployments')
  .select('*')
  .range(from, to);

// 2. Extract the unique template IDs from the results.
const templateIds = [...new Set(deployments.map(d => d.template_id))];

// 3. Perform a second, batched query to get all required templates in one go.
//    This uses the unified 'all_templates' view.
const { data: templates } = await supabase
  .from('all_templates')
  .select('*')
  .in('id', templateIds);

// 4. Merge the data in the application layer.
const templateMap = new Map(templates.map(t => [t.id, t]));
const deploymentsWithTemplates = deployments.map(deployment => ({
  ...deployment,
  template: templateMap.get(deployment.template_id) || null
}));
```
This pattern is performant, avoids N+1 query problems, and is more resilient to schema changes than relying on automatic joins.

### 1.4. Authentication & Authorization

Authentication is handled via a wallet signature, proving ownership of a wallet address.

1.  **User Connects Wallet**: The user connects their wallet via the frontend (`wagmi`).
2.  **JWT Request**: When a secure action is needed, the `createAuthenticatedSupabaseClient` function sends the user's wallet address to our backend API at `/api/auth/wallet/route.ts`.
3.  **Server-Side JWT Signing**: The backend API uses the `SUPABASE_JWT_SECRET` (a private server secret) to sign a JWT. The payload of this token includes the user's wallet address.
    ```json
    {
      "address": "0x...",
      "role": "authenticated",
      "exp": 167...
    }
    ```
4.  **Authenticated Requests**: The JWT is sent back to the client, which then uses it in the `Authorization: Bearer <token>` header for all subsequent requests to Supabase.
5.  **RLS Enforcement**: Supabase validates the JWT signature and makes the payload available to RLS policies via `auth.jwt()`. Our policies use `auth.jwt() ->> 'address'` to match against `creator_address` or `executor_address` columns, thereby enforcing data isolation.

This model is highly secure because **only the server** can create a valid JWT, preventing users from impersonating other addresses.

---

## 2. Security & Data Integrity

### 2.1. Row Level Security (RLS) Policies

RLS is enabled on all tables containing user-specific data. This is a non-negotiable security requirement.

-   **`user_contract_templates`**:
    -   **Policy**: `(lower(auth.jwt() ->> 'address') = lower(creator_address))`
    -   **Purpose**: Ensures users can only read or write their own templates. The `lower()` function prevents case-sensitivity issues with wallet addresses.

-   **`recipes`**:
    -   **`SELECT` Policy**: `(is_public = true OR lower(auth.jwt() ->> 'address') = lower(creator_address))`
    -   **`ALL` (Write) Policy**: `(lower(auth.jwt() ->> 'address') = lower(creator_address))`
    -   **Purpose**: Allows users to view all public recipes but only their own private recipes. Write access is strictly limited to the original creator.

-   **`recipe_executions`**:
    -   **Policy**: `(lower(auth.jwt() ->> 'address') = lower(executor_address))`
    -   **Purpose**: Strictly isolates recipe execution history, ensuring a user can only see the results of recipes they personally ran.

### 2.2. Data Integrity Measures

-   **Orphaned Record Prevention**: Deleting a template is now a "safe" operation. The `deleteUserTemplate` function in `src/lib/supabase/recipes.ts` first queries the `deployments` table to check if the template is in use. If it is, the deletion is aborted, and an informative error is returned to the user. This application-level check was chosen over a database-level constraint for flexibility.
-   **UNIQUE Constraints**: A `UNIQUE` constraint on `(creator_address, name)` was added to the `user_contract_templates` table to prevent a user from creating multiple private templates with the same name.
-   **CHECK Constraints**: Status fields like `deployment_status` and `template.status` use `CHECK` constraints to ensure only valid enum values can be inserted, preventing data corruption.

---

## 3. Performance Optimizations

### 3.1. Database Indexing Strategy

To ensure the application remains fast as the dataset grows, several key indexes have been implemented.

-   **Index: `idx_deployments_lower_deployer_address`**
    -   **Table**: `deployments`
    -   **Column**: `LOWER(deployer_address)`
    -   **Purpose**: Drastically speeds up queries for the "My Contracts" dashboard tab. Without this, the database would have to perform a full table scan, which would be unacceptably slow with thousands of deployments.
    -   **Query pattern**: `.ilike('deployer_address', userAddress)`

-   **Index: `idx_recipes_lower_creator_address`**
    -   **Table**: `recipes`
    -   **Column**: `LOWER(creator_address)`
    -   **Purpose**: Optimizes filtering for "My Recipes" in the recipe library.
    -   **Query pattern**: `.eq('creator_address', userAddress)`

These indexes are the single most important performance optimization in the application.

### 3.2. Query Optimization

-   **Server-Side Pagination**: All list views (dashboards, libraries) are architected to use server-side pagination (`.range(from, to)`). This ensures that the client only ever fetches one page of data at a time, keeping the application fast regardless of the total number of rows in the database.
-   **Efficient Counting**: Total counts for pagination are fetched using `select('*', { count: 'exact', head: true })`, which is highly optimized and does not return the actual data.
-   **Batched Queries**: The two-step data fetching pattern uses `.in('id', [id1, id2, ...])` to fetch all necessary related data in a single, efficient query, preventing N+1 problems.

---

## 4. Development Evolution & Key Decisions

The application's architecture evolved through several key phases to address scaling and security challenges.

1.  **MVP Phase**: Initial development focused on a single-user model with public templates. This was fast to build but was not secure or scalable.
2.  **Multi-User Refactor**: The introduction of `user_contract_templates` and RLS was the first major architectural shift. This phase introduced the authentication challenges that were later solved.
3.  **Database & Security Hardening**: This was the most critical phase.
    -   **Decision**: To abandon PostgREST's automatic joins in favor of an explicit, application-layer join strategy.
        -   **Rationale**: The `all_templates` VIEW provided a clean data model but broke the magic joins. Re-implementing this logic explicitly in the application (`two-step fetch`) made data fetching more predictable and robust.
    -   **Decision**: Implement a server-side BFF for JWT signing.
        -   **Rationale**: Client-side JWT signing is insecure. Moving this to a serverless function (`/api/auth/wallet`) is the industry-standard way to securely authenticate users with a database like Supabase.
4.  **UX & Performance Polish**:
    -   **Decision**: Add loading states to all async buttons.
        -   **Rationale**: Solved race conditions and provided critical user feedback.
    -   **Decision**: Add confirmation dialogs for all destructive actions.
        -   **Rationale**: Prevented irreversible data loss, a critical trust and safety feature.

---

## 5. Getting Started (Developer Guide)

### 5.1. Prerequisites
-   Node.js `v18.0` or later
-   `npm`
-   A Supabase account
-   MetaMask browser extension

### 5.2. Installation
1.  Clone the repository: `git clone https://github.com/theweb3wizard/FlowForge.git`
2.  Navigate to the directory: `cd FlowForge`
3.  Install dependencies: `npm install`
4.  Set up environment variables by copying `.env.example` to `.env.local` and filling in your Supabase and RPC details.

### 5.3. Database Setup
Execute the following SQL scripts in your Supabase SQL Editor in the specified order.

**Script 1: Create Tables**
```sql
-- Create contract_templates table for public templates
CREATE TABLE public.contract_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  parameters jsonb,
  abi jsonb NOT NULL,
  bytecode text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'deprecated'::text, 'soon'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contract_templates_pkey PRIMARY KEY (id)
);

-- Create user_contract_templates table for private, user-created templates
CREATE TABLE public.user_contract_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_address text NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'FileCode'::text,
  abi jsonb NOT NULL,
  bytecode text NOT NULL,
  parameters jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_contract_templates_pkey PRIMARY KEY (id),
  CONSTRAINT user_contract_templates_creator_name_unique UNIQUE (creator_address, name)
);

-- Create deployments table to record all contract deployments
CREATE TABLE public.deployments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  contract_name text NOT NULL,
  contract_address text NOT NULL,
  deployer_address text NOT NULL,
  deployed_at timestamp with time zone NOT NULL DEFAULT now(),
  transaction_hash text,
  template_id uuid,
  network text NOT NULL DEFAULT 'blockdag-testnet'::text,
  chain_id integer,
  constructor_args jsonb DEFAULT '{}'::jsonb,
  deployment_status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  CONSTRAINT deployments_pkey PRIMARY KEY (id)
);

-- Create recipes table
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_address text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  network text,
  is_public boolean DEFAULT false,
  tags text[],
  execution_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id)
);

-- Create recipe_executions table
CREATE TABLE public.recipe_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id uuid,
  executor_address text NOT NULL,
  status text NOT NULL,
  current_step integer DEFAULT 0,
  total_steps integer NOT NULL,
  step_results jsonb DEFAULT '[]'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  CONSTRAINT recipe_executions_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_executions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE
);
```

**Script 2: Create Views and Indexes**
```sql
-- Create the unified 'all_templates' view
CREATE OR REPLACE VIEW public.all_templates AS
SELECT id, name, description, icon, abi, bytecode, parameters, created_at, 'public' AS source_table, NULL::text AS creator_address
FROM public.contract_templates
UNION ALL
SELECT id, name, description, icon, abi, bytecode, parameters, created_at, 'user' AS source_table, creator_address
FROM public.user_contract_templates;

-- Create performance indexes
CREATE INDEX idx_deployments_lower_deployer_address ON public.deployments (lower(deployer_address));
CREATE INDEX idx_recipes_lower_creator_address ON public.recipes (lower(creator_address));
```

**Script 3: Enable Row Level Security**
```sql
-- Secure user_contract_templates
ALTER TABLE public.user_contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own templates" ON public.user_contract_templates FOR ALL
USING (lower(auth.jwt() ->> 'address') = lower(creator_address));

-- Secure recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access and individual read access" ON public.recipes FOR SELECT
USING (is_public = true OR lower(auth.jwt() ->> 'address') = lower(creator_address));
CREATE POLICY "Allow full access to own recipes" ON public.recipes FOR ALL
USING (lower(auth.jwt() ->> 'address') = lower(creator_address));

-- Secure recipe_executions
ALTER TABLE public.recipe_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to own executions" ON public.recipe_executions FOR ALL
USING (lower(auth.jwt() ->> 'address') = lower(executor_address));
```

### 5.4. Running Locally
```bash
npm run dev
```
The application will be available at `http://localhost:9002`.
