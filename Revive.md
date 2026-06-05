# REVIVE.md — FlowForge Strategic Resurrection Document
**Compiled by:** Elite VC / CPO / Web3 Architect Lens  
**Date:** June 5, 2026  
**Subject:** FlowForge — Smart Contract Orchestration Platform (BlockDAG Buildathon, Wave 4)  
**Classification:** Phase 1 — Discovery & Research Output

---

> *"A scalpel beats a sledgehammer. The question is never what to build — it's what to ruthlessly remove."*

---

## SECTION 1: BRUTAL AUDIT OF THE CURRENT STATE

### 1.1 The Hackathon Debt Problem

Let's start with the context that shapes everything: **FlowForge was built under hackathon conditions.** Wave 1 through Wave 4. Each wave piled on features to satisfy judging criteria rather than to solve a precise user problem. The documentation itself is the confession — Wave 4's "Key Achievements" section reads like a demo spec sheet, not a product changelog.

This is not a critique of effort. It is a structural diagnosis. Hackathon products are wired differently than SaaS products, and the gap between the two does not close by adding more features. It closes by deleting most of them.

---

### 1.2 Architectural Liabilities — What Will Kill You in Production

**Liability 1: The BlockDAG Chain Lock-In**

The entire platform is hardcoded to a single chain: BlockDAG testnet (Chain ID 1043). The `.env` configuration requires `NEXT_PUBLIC_BLOCKDAG_RPC_URL`, `NEXT_PUBLIC_BLOCKDAG_CHAIN_ID`, and `NEXT_PUBLIC_BLOCKDAG_EXPLORER_URL` as static environment variables. This means:

- The product lives and dies on BlockDAG's network health. One RPC outage, one slow finality period, and your entire sequential deployment pipeline hangs indefinitely — with no automatic retry, no fallback endpoint, and no user-friendly error state described in the current architecture.
- The buildathon required BlockDAG targeting, but there is zero business reason for a general-purpose deployment tool to be chained to one network. Every chain you're not on is a market you've locked yourself out of.
- BlockDAG's mainnet only launched on February 10, 2026. Developer activity exists but is early-stage and heavily grant-incentivized. This is not a sustainable user base without the grant narrative.

**Liability 2: The Sequential Deployment Chain-of-Promises**

`useBatchDeploy.ts` orchestrates deployments by iterating through each item and awaiting its completion before proceeding. This is a chain of async promises — one for each on-chain transaction. The failure modes are severe and not described as handled in the documentation:

- Transaction dropped from mempool → entire batch stalls
- RPC timeout mid-sequence → unclear state — some contracts deployed, some not, no automatic recovery
- Gas spike causing rejection → no retry logic documented
- User closes browser mid-execution → state is lost (React state, not persisted)

This is the most dangerous technical liability. A batch of four transactions where step three fails leaves two deployed contracts in limbo — the user has spent gas, has partial infrastructure on-chain, and has no path to resume. This is not a theoretical edge case; it is what happens in real EVM deployments regularly.

Compare this to how Hardhat Ignition (before it was archived in October 2025) handled this: it persisted deployment state to disk after every step, so any interruption could be resumed from the exact point of failure. FlowForge has no equivalent.

**Liability 3: The Database-Driven Template Library Is an Operational Trap**

The shift from hardcoded templates to a "database-driven contract library" fetched dynamically from Supabase sounds like a win. It is not. It created an ongoing operational obligation that a solo developer will not sustain:

- Someone must write, vet, and maintain the ABI and bytecode for every template in the database.
- Contracts change. ERC standards evolve. OpenZeppelin releases new versions. Every update requires a manual database operation.
- There is no automated pipeline from "new standard is released" to "template is updated in Supabase."
- The `getActiveTemplates` function fetches from Supabase on every homepage load, adding latency and a dependency on a third-party service just to render your landing page.

For v1 of a solo-founder product, a static, curated list of 5–8 battle-tested templates in a JSON file inside the codebase beats a dynamic database library every time. Speed of page load, zero operational overhead, and no Supabase cold start latency.

**Liability 4: Recipes Were Shipped as a Skeleton**

The flagship feature of Wave 4, described in grandiose terms throughout the documentation, has the following listed as **future work**:
- Recipe Saving & Sharing
- Adding "Interact" steps to Recipes (function calls, not just deployments)

This means the submitted product has a recipe engine that can queue multiple deployments but **cannot actually save those recipes** for later reuse and **cannot chain interact-calls after deployments**. The two most valuable behaviors — the ones that justify calling it "orchestration" — were not shipped.

The batch deployment UI that was shipped is a queue, not a workflow engine. Without variable passing from step output to step input, it is just a convenience wrapper around consecutive deploys. The variable passing syntax (`${step1.contractAddress}`) appears in the documentation as a design intent, not a confirmed shipped feature.

**Liability 5: ABI Parsing as a Surface of Infinite Complexity**

`src/lib/abi/parser.ts` was "enhanced with better logic to handle more diverse ABI structures." This is the most dangerous sentence in the entire documentation. ABI parsing for arbitrary user-uploaded contracts is a rabbit hole with no bottom:

- Array types, nested structs, tuples, custom errors, events, function overloads, fallback functions, receive functions, payable vs. non-payable detection, uint256 vs. uint8 disambiguation in forms...
- Every new contract type a user brings will hit an edge case the parser hasn't seen.
- For a solo developer, building a robust general-purpose ABI parser is a multi-week project in itself, and then an ongoing maintenance burden forever.

The correct architecture for v1 is to limit ABI parsing to a known subset: constructor params (for deploy) and a selected subset of function signatures (for interact). No ambiguity, no edge cases.

---

### 1.3 UI/UX Audit — The User Retention Killers

**The Mental Model Mismatch**

The current UX presents FlowForge as a "template browser" on the homepage — the user lands, sees a library of contracts, and clicks to deploy one. This mental model positions FlowForge as a slightly smarter Remix. It buries the Recipes system — the only truly differentiated feature — behind a "Batch Cart" interaction that is itself hidden in a sheet/drawer component.

A user who wants to deploy a token and sees a template browser will deploy the token, get their address, and leave. They won't discover the batch cart. They won't discover recipes. They'll return to Remix next time.

The homepage should lead with the Recipe builder. Not the template library. Not a "deploy one contract" button. The core action — "Build a deployment workflow" — should be the first thing a user sees and does.

**The Progress Feedback Problem**

`BatchProgressModal.tsx` provides real-time feedback per step. This is good. But real-time progress is meaningless if the user doesn't understand what failed and why. A "Failed" state without an actionable error message, a link to the failed transaction on the block explorer, and a path to retry from that step is worse than no feedback at all — it creates anxiety without resolution.

**Authentication Friction**

The multi-user RLS setup with Supabase JWT secrets suggests the platform requires both wallet connection AND Supabase authentication. This is two separate auth flows for what should be a seamless onboarding experience. Developers landing from a link will not complete two auth steps to try a new tool. For a non-custodial Web3 tool, wallet connection alone should be sufficient for basic functionality.

**Dashboard Noise**

A "Real-Time Dashboard" tracking all public deployments sounds impressive. In practice, for a tool with fewer than 1,000 users, this dashboard shows mostly your own deployments with occasional entries from strangers. It adds architectural complexity (real-time Supabase subscriptions) for zero product value to new users.

---

## SECTION 2: 2026 DEEP MARKET & COMPETITIVE LANDSCAPE

### 2.1 The Nuclear-Level Market Signal You Cannot Ignore

On **June 30, 2025**, OpenZeppelin disabled all new sign-ups for Defender — their managed smart contract operations platform that served **15,000+ blockchain developers** across protocols like Compound and Matter Labs. The final shutdown is scheduled for **July 1, 2026 — 26 days from today.**

This is not a product pivot. This is OpenZeppelin deliberately vacating an entire category of developer tooling and telling their users to self-host open-source alternatives.

The deployment automation SaaS market for Web3 developers has a crater in it the size of the largest brand in the space. The teams that were using Defender for deployment orchestration — the multi-step "deploy, initialize, grant roles, transfer ownership" workflows — are actively shopping for alternatives **right now.**

This is the single most important data point in this document.

### 2.2 Competitive Landscape — Who Exists and Where Their Gaps Are

---

**Competitor 1: Thirdweb Deploy**
- **What it does:** Single-command CLI deployment to 2,000+ EVM chains. Pre-audited contract templates (ERC-20, ERC-721, ERC-1155, marketplace). Dashboard for managing deployed contracts.
- **Pricing:** Starter $5/month, Growth $99/month, Scale $499/month. Added 2.5% platform fee on prebuilt contract primary sales (February 2025).
- **Who uses it:** Consumer-facing app developers. NFT drop creators. Gaming studios. Token launchers.
- **Critical gaps:**
  - Zero orchestration capability. Each contract is deployed individually. There is no concept of step 2 depending on step 1's output address.
  - Templates are Thirdweb's own contracts, not yours. Custom Solidity contracts are supported but lose all the template benefits.
  - The 2.5% platform fee on primary sales is a recurring extraction that protocol teams building real financial infrastructure will refuse.
  - Their positioning is consumer apps (NFTs, games). DeFi protocols, governance systems, and custom infrastructure are out of scope.
- **FlowForge's wedge:** Custom contract orchestration with variable passing. No fee extraction. Protocol-team focus.

---

**Competitor 2: Tenderly**
- **What it does:** Transaction simulation, debugging, gas profiling, real-time monitoring, Virtual TestNets. Primarily a DevOps observability platform, not a deployment tool.
- **Pricing:** Free tier, Starter $80+/month, Pro $350M compute units/month.
- **Who uses it:** Teams monitoring live production contracts. Developers debugging failed transactions.
- **Critical gaps:**
  - Tenderly does not orchestrate deployments. It simulates and monitors them.
  - If you want to deploy token + staking + governance sequentially and pass addresses between them, Tenderly does not help you.
  - Heavy pricing for solo developers ($80/month minimum for real usage).
- **FlowForge's wedge:** Deployment execution, not post-deployment observation. Adjacent categories, not competing ones.

---

**Competitor 3: Hardhat Ignition (Archived)**
- **What it does (did):** Declarative, code-based deployment system. Define modules in TypeScript, handle dependencies and variable passing. Merged into the Hardhat monorepo in October 2025.
- **Who uses it:** Experienced Solidity developers comfortable with TypeScript.
- **Critical gaps:**
  - **100% code-first.** You write TypeScript modules to define deployment logic. There is no GUI.
  - Requires a local development environment: Node.js, Hardhat installed, config files set up.
  - Zero accessibility for developers who want to define a workflow visually or use someone else's contract without setting up a full dev environment.
  - No sharing mechanism. Your deployment module lives in your repo. Team members need the same repo and environment.
- **FlowForge's wedge:** GUI-first. Browser-based. No local environment required. Shareable recipe URLs. This is "Hardhat Ignition for non-Hardhat developers" — a category Ignition explicitly cannot serve.

---

### 2.3 The Honest TAM and Who Actually Pays

**Tier 1 — Web3 Consultancies and Development Agencies (Highest WTP)**

These are firms or solo contractors who build smart contract infrastructure for clients. They deploy a full token+staking+governance system multiple times per year, for different clients, on different chains. Their pain is not technical — they know how to write Hardhat scripts. Their pain is **time** and **repeatability**.

A consultant who charges $10,000–$50,000 for a protocol deployment engagement will pay $49/month for a tool that cuts their deployment time from 4 hours of scripting to 20 minutes of recipe configuration. The ROI calculation takes 10 seconds. These are your buyers.

Estimated addressable segment: ~5,000–15,000 developers globally. Even 0.5% conversion at $49/month = $1,225–$3,675 MRR from this segment alone.

**Tier 2 — Protocol Development Teams (Medium-High WTP)**

In-house teams at DeFi protocols, GameFi studios, and DAO infrastructure projects. They have a treasury, they have developers who resent writing deployment scripts, and they need testnet→mainnet reproducibility with a documented audit trail. The OZ Defender shutdown is directly affecting this segment today.

They will pay $79–$99/month for a team workspace with shared recipes and execution history.

**Tier 3 — Individual Smart Contract Developers (Low-Medium WTP)**

Solo developers building personal projects, learning DeFi, shipping to hackathons. They want to move fast and avoid copy/paste errors. They'll use a free tier heavily and upgrade if you build enough value. They are not your primary revenue driver but they are your distribution vector — they bring their tools to their next job.

**Who does NOT have budget:**
- Hackathon participants deploying to testnets once. Build free tools for them if you want distribution, but don't build your product around their needs.
- Students and learners. Same dynamic.

---

### 2.4 The Specific Problem Worth Solving — The "Painkiller" Statement

> A Web3 developer or consultant needs to deploy an interconnected system of smart contracts — token, staking, governance, vesting — across EVM chains, in a specific order, where each contract's constructor or initializer requires the address of a previously deployed contract. Today, they either write a custom Hardhat/Foundry script from scratch for every project, manually copy-paste addresses between Remix deployments, or pay an OpenZeppelin Defender subscription that is dead in 26 days. There is no GUI-first, chain-agnostic, reusable workflow tool that handles dependent deployments without requiring a local development environment.

**That is the exact problem. FlowForge Recipes, stripped of all other features, solves exactly this.**

---

## SECTION 3: THE "GOLDMINE" REFACTOR BLUEPRINT

### 3.1 The Strategic Pivot — One Sentence

**Kill everything. Ship one feature: a GUI-first, chain-agnostic, reusable smart contract deployment workflow builder where each step can reference the output of any previous step.**

Everything else — the public template library, the real-time public deployment dashboard, the RLS multi-user complexity, the database-driven template store — is distraction from this single, sellable, defensible product surface.

---

### 3.2 Product Rename & Repositioning

Keep the name FlowForge. It is good — it connotes workflow and construction, and it has a developer aesthetic. What changes is the **positioning**:

**Before (implied by the current product):** "A smart contract deployment platform for BlockDAG."

**After:** "Build deployment workflows for any EVM chain. Define once. Run anywhere. Share with your team."

The one-liner for the homepage header: *"Stop writing deployment scripts. Build a Recipe instead."*

The secondary hook — use it in your distribution copy: *"Your OZ Defender alternative for deployment orchestration."*

---

### 3.3 The "Painkiller" Feature Set — What Gets Built, What Gets Deleted

**What stays:**
- Wallet connection (wagmi v2 + viem)
- Chain selection (any EVM chain from a curated list)
- Recipe builder UI (the new core experience)
- Step execution engine with variable passing
- Supabase persistence for saved recipes and execution history

**What gets deleted:**
- Public template library from Supabase (replace with 6–8 hardcoded static templates as starting points for steps)
- Real-time public deployments dashboard
- Batch cart / BatchContext (replaced by Recipe builder)
- `NEXT_PUBLIC_BLOCKDAG_*` environment variables
- The `deployments` table as a public gallery
- All BlockDAG-specific branding, chain configs, and explorer links

**What gets built net-new:**
- EVM chain selector with a curated list (Ethereum Mainnet, Sepolia, Base, Polygon, Arbitrum, Optimism, BSC, and **BlockDAG** — kept as an option, not as a mandate)
- Variable picker UI: when configuring step N's parameters, a dropdown shows available outputs from steps 1 through N-1
- Recipe share link generation (public read-only URL for a recipe)
- Execution resume: if a recipe run fails at step N, allow the user to re-run from step N after fixing the issue, with previous step outputs pre-filled
- Step result persistence in the `executions` table so execution state survives a browser close

---

### 3.4 Technical Specifications

#### Tech Stack — Final Decisions

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js App Router | 15.x | Keep from original. Server components for data fetching, Client components for wallet interaction. |
| Language | TypeScript | 5.x | Keep from original. |
| Styling | Tailwind CSS + shadcn/ui | Latest | Keep from original. |
| State | TanStack Query v5 + Zustand | Latest | TanStack Query for server state. Replace BatchContext/React Context with Zustand for recipe builder UI state — simpler, no re-render cascades. |
| Database | Supabase (PostgreSQL) | Latest | Keep from original. Simplify schema significantly. |
| Wallet | wagmi v2 + viem | Latest | Keep. Remove ALL BlockDAG-specific chain configs. Use viem's built-in `mainnet`, `sepolia`, `base`, `polygon`, `arbitrum`, `optimism`, `bsc` chains plus a custom BlockDAG chain object as one option among many. |
| Auth | Supabase Auth (Email Magic Link) | — | Simplify. Remove JWT secret complexity. Wallet address stored as user identifier in profile table. Sign-in with wallet only for basic use; email for recipe sharing and persistence. |
| Payments | Lemon Squeezy | Latest | Your standard. Keep it. |

**Do NOT add:**
- Redis / caching layer — Supabase is sufficient at this scale
- Any background job queue — execution happens client-side, in the browser, through the user's wallet
- Any blockchain RPC provider account (Alchemy, Infura) as a platform dependency — the user's wallet RPC handles all on-chain calls
- AI generation features at launch — save that for v2

---

#### Simplified Database Schema

The original schema had `contract_templates`, `deployments`, and whatever undocumented tables existed. The new schema has three tables:

```
recipes
  - id: uuid (PK)
  - user_id: uuid (FK → auth.users)
  - name: text (NOT NULL)
  - description: text
  - is_public: boolean (default false)
  - created_at: timestamptz
  - updated_at: timestamptz

recipe_steps
  - id: uuid (PK)
  - recipe_id: uuid (FK → recipes, CASCADE DELETE)
  - step_order: int (NOT NULL)
  - step_type: text ('deploy' | 'interact')
  - label: text (NOT NULL, user-defined display name)
  - abi: jsonb (NOT NULL)
  - bytecode: text (only for 'deploy' steps)
  - target_address: text (only for 'interact' steps; supports variable ref syntax)
  - function_name: text (only for 'interact' steps)
  - constructor_params: jsonb (array of param configs: {name, type, value, isVariable, variableRef})
  - UNIQUE(recipe_id, step_order)

executions
  - id: uuid (PK)
  - recipe_id: uuid (FK → recipes)
  - user_id: uuid (FK → auth.users)
  - chain_id: int (NOT NULL)
  - status: text ('pending' | 'running' | 'partial' | 'success' | 'failed')
  - step_results: jsonb (array: [{step_order, status, tx_hash, contract_address, error_message, completed_at}])
  - started_at: timestamptz
  - completed_at: timestamptz
```

**That is the entire schema. Three tables. No foreign keys to contract_templates because templates don't live in the database anymore. No public deployments gallery table. No user profiles table beyond what Supabase Auth provides.**

Row Level Security policies:
- `recipes`: Users can CRUD their own. Read-only access to `is_public = true` rows for any user.
- `recipe_steps`: Access inherited from parent recipe's user_id.
- `executions`: Users can CRUD their own only.

---

#### Data Flow — The Execution Engine

This is the most critical architectural decision in the entire refactor. Get this right.

**The Execution Engine lives entirely in a custom React hook: `useRecipeExecution.ts`**

Flow:
1. User clicks "Run Recipe" → selects target chain → hook initiates
2. Hook creates a new row in `executions` with `status: 'running'`, `step_results: []`
3. Hook iterates through `recipe_steps` ordered by `step_order`
4. For each step:
   a. If `step_type === 'deploy'`: resolves all constructor params (substituting any variable references from previous step results stored in local hook state), calls `deployContract` via wagmi's `useDeployContract`, awaits confirmation
   b. If `step_type === 'interact'`: resolves target address and function params, calls `writeContract` via wagmi, awaits confirmation
   c. On success: stores result `{contractAddress, txHash}` in hook state AND immediately upserts `executions.step_results` in Supabase with the result for this step. This is the resume mechanism — if the browser closes, the results of completed steps are persisted.
   d. On failure: updates execution `status` to `'partial'`, writes the error to `step_results[N].error_message`, halts iteration, surfaces error to UI
5. On full success: updates execution `status` to `'success'`, `completed_at` to now
6. UI subscribes to the hook's state, rendering a step-by-step progress card for each step

**The variable resolution function** deserves its own named utility: `resolveStepParam(paramConfig, completedStepResults[])`. It checks if `paramConfig.isVariable === true`, extracts the referenced `step_order` and field name from `paramConfig.variableRef` (e.g., `"step_1.contractAddress"`), and returns the value from `completedStepResults`. This function is pure and independently testable.

---

### 3.5 UI/UX Reflow — The Complete User Journey

**Design Philosophy:** Dark, premium, surgical. Your existing brand instinct is correct for this audience. Web3 developers are used to dark UIs. Make it feel like a professional-grade instrument, not a hackathon demo.

No rounded cartoon cards. No colorful gradient hero sections. Dark background (#0A0A0A or near), subtle grid texture, sharp typography, monospace fonts for contract addresses and transaction hashes, green/amber status indicators for execution states.

---

**Screen 1: Landing Page (Not Logged In)**

Split into two sections:

*Left (40% width):*
- Logo + product name in the top-left
- Headline: "Build deployment workflows. Run them on any EVM chain."
- Sub-headline: "Define a sequence of contract deployments once. Reuse it across testnets and mainnet. No scripts, no copy-paste errors."
- Two CTAs: "Start Building Free" and "View Demo Recipe"
- Small text below: "Now with OZ Defender shutting down July 1st, 2026 — you need an alternative."

*Right (60% width):*
- An animated visual showing a recipe in action: three steps ("Deploy Token", "Deploy Staking", "Grant Minter Role") executing sequentially with a green checkmark appearing on each

*Below the fold:*
- Three value props in a horizontal grid: "No Local Setup", "Variable Passing", "Share Recipes"
- Competitor comparison table: FlowForge vs. Remix vs. Thirdweb vs. Hardhat Ignition (no OZ Defender row — they're dead)

---

**Screen 2: Sign In**

Single-option sign-in. "Connect Wallet" button, centered. No email form on this screen. Once connected, user proceeds to the app. Email for receipt/sharing is optional and prompted only when they try to share a recipe.

---

**Screen 3: My Recipes (Dashboard)**

- Top navigation: Logo / My Recipes / Executions / Settings
- Primary CTA: "New Recipe" button, top-right
- Recipe list as cards: name, description, last modified, step count, chain indicator, "Run" and "Edit" quick actions on each card
- Empty state: a clear call-to-action to create the first recipe, with a brief sentence explaining what a recipe is
- No public deployments feed. No other users' data. Just the user's own work.

---

**Screen 4: Recipe Builder (The Core UI)**

This is the product. Everything else exists to get users here.

Layout: Two-panel.

*Left Panel (30% width) — Step List:*
- Ordered list of steps, each showing: step number, label, step type badge ("Deploy" in blue / "Interact" in amber)
- "Add Step" button at the bottom
- Drag handle on each step for reordering
- Clicking a step loads its config form in the right panel

*Right Panel (70% width) — Step Configuration:*

When a Deploy step is selected:
- Field: Step Label (free text, e.g., "Deploy Token Contract")
- Field: Contract Name (for display in execution log)
- Field: ABI (textarea or JSON file upload button)
- Field: Bytecode (textarea or .bin file upload button)
- Section: Constructor Parameters — dynamically generated from parsed ABI constructor
  - Each param shows: param name, type (greyed out label), and a value input
  - Beside each value input: a "Use Variable" toggle
  - When toggled: replaces the text input with a dropdown showing available outputs from previous steps (e.g., "Step 1 → contractAddress", "Step 2 → contractAddress")

When an Interact step is selected:
- Field: Step Label
- Field: Target Address — text input OR "Use Variable" toggle with previous step output selector
- Field: ABI (textarea or upload)
- Field: Function Name — dropdown populated from ABI's non-view, non-pure functions
- Section: Function Parameters — same dynamic generation with "Use Variable" toggles

*Top of Right Panel:*
- "Save Recipe" button
- "Run Recipe" button (opens chain selector modal before execution)

---

**Screen 5: Run Modal — Chain Selection**

A modal overlay triggered by "Run Recipe":
- Dropdown of supported EVM chains (curated list of 8–10 chains, each with logo and name)
- Network fee warning for mainnet chains
- "Confirm and Execute" button

After confirmation, the modal transforms into:

---

**Screen 6: Execution Progress Modal**

Full-screen overlay or dedicated page (not a small modal — this is a critical operation):
- Recipe name and chain at the top
- Vertical step-by-step progress tracker, each step showing:
  - Step number and label
  - Current status: Pending (grey) / Running (pulsing amber) / Success (green with ✓) / Failed (red with ✗)
  - When complete: contract address (for deploy) or tx hash (for interact), each clickable to the block explorer
  - When failed: error message in red text, formatted for readability (not a raw RPC error dump)
- Bottom of screen when all steps complete:
  - "Execution Complete" headline
  - "Copy All Addresses" button (copies all deployed contract addresses as a formatted list)
  - "View Execution History" link
  - "Run Again" button (same recipe, new execution)

---

**Screen 7: Execution History**

A table per recipe showing all past runs:
- Columns: Execution ID, Chain, Date, Status, Actions
- Clicking a row opens the full step result breakdown (same view as Screen 6, but read-only)
- Export to CSV button: exports all contract addresses and tx hashes from an execution

---

### 3.6 Pricing Architecture

Three tiers, anchored on the features that matter to your real buyers:

| Tier | Price | Key Limits | Target User |
|---|---|---|---|
| **Free** | $0 | 3 recipes, testnets only, no sharing | Individual devs exploring, hackathon teams |
| **Builder** | **$49/month** | Unlimited recipes, mainnet support, share via URL, 6 months execution history | Solo consultants, individual devs shipping real protocols |
| **Team** | **$99/month** | Everything in Builder + team workspace (up to 5 members), shared recipe library, 12 months history, priority support | Protocol dev teams, agencies |

Annual discount: 20% off (Builder = $39/month, Team = $79/month). Display annually on pricing page to increase LTV.

**Revenue math for conviction:**
- 50 Builder subscribers = $2,450 MRR
- 20 Team subscribers = $1,980 MRR
- 70 total paying users = **$4,430 MRR ($53,160 ARR)**

This is achievable within 6 months of launch with the OZ Defender vacuum and the right distribution strategy.

---

### 3.7 Distribution — Where to Get First Users

**First 14 days:**
1. Post to r/ethdev with a framing of "I built a visual alternative to Hardhat Ignition after OZ Defender shutdown" — this framing has a specific urgency and a named pain point. Do not post as "I built a deployment tool."
2. Post to the Ethereum, Base, and Arbitrum developer Discord communities.
3. Write one short technical blog post on Mirror or Paragraph: "How to deploy a token + staking system in one Recipe without writing any deployment scripts." Distribute this post everywhere.
4. Open a thread on HackerNews "Show HN" — "Show HN: FlowForge, a GUI-first deployment workflow builder for EVM chains."

**Ongoing:**
5. Build a public "Recipe Library" page with 5–10 pre-built, shareable recipes for common protocol patterns (DeFi token system, DAO governance setup, NFT contract + royalty splitter). These are content marketing artifacts that rank in search for queries like "deploy token and staking contract tutorial."
6. Reach out directly to 20 Web3 consultants on LinkedIn or X with a message that references the OZ Defender shutdown by name.

---

### 3.8 What Success Looks Like at 90 Days

- Product is live, publicly accessible, with real mainnet execution tested on Ethereum and Base
- At least 200 recipe creations on Free tier
- At least 15 paid Builder or Team subscribers ($735+ MRR)
- At least 3 testimonials from users who used it to deploy real production contracts
- A functional public Recipe Library with 8+ shareable recipes

These are the benchmarks. If you hit them, scale distribution. If you miss them, the product has a positioning problem, not a code problem.

---

*End of Revive.md — Phase 1 Output*  
*Awaiting approval to proceed to Phase 2: Agent.md*
