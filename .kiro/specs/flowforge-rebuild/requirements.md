# Requirements Document

## Introduction

FlowForge is a GUI-first, chain-agnostic smart contract deployment workflow builder. Users create "Recipes" — ordered, reusable sequences of EVM contract deployment and interaction steps — where each step's parameters can reference the outputs (deployed contract address, transaction hash) of any previous step. Recipes are saved to Supabase, executed through the user's connected wallet, and optionally shared via a public URL. The product targets Web3 developers, consultants, and protocol teams who need repeatable, cross-chain deployment orchestration without writing custom scripts.

The rebuild eliminates all hackathon-era technical debt, discards the public template library, batch-cart model, and BlockDAG-only chain lock-in, and replaces them with a clean five-screen architecture: Landing Page, My Recipes Dashboard, Recipe Builder, Execution Progress, and Execution History.

---

## Glossary

- **Recipe**: An ordered collection of Steps that defines a smart contract deployment workflow.
- **Step**: A single unit of work within a Recipe. A Step is either a `deploy` step (deploys a contract) or an `interact` step (calls a function on an already-deployed contract).
- **Variable Reference**: A string token of the form `${step_N.contractAddress}` or `${step_N.txHash}` that, at execution time, is replaced with the real output value produced by Step N.
- **Step Result**: The output produced by executing a single Step, containing `contractAddress`, `txHash`, `status`, and optionally `errorMessage`.
- **Execution**: A single run of a Recipe against a specific EVM chain, persisted in Supabase with per-step results.
- **Recipe Builder**: The two-panel UI screen where users author and edit Steps within a Recipe.
- **Execution Engine**: The logic encapsulated in the `useRecipeExecution` hook that iterates Steps sequentially, resolves Variable References, submits on-chain transactions through the user's wallet, and persists results.
- **Param Config**: A configuration object for a single constructor or function parameter: `{ name, type, value, isVariable, variableRef }`.
- **Supported Chains**: The curated list of nine EVM chains the platform supports: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, BlockDAG Mainnet.
- **Free Tier**: The $0 plan — up to 3 Recipes, testnet chains only.
- **Builder Tier**: The $49/month plan — unlimited Recipes, all chains, recipe sharing.
- **Team Tier**: The $99/month plan — everything in Builder plus team workspace for up to 5 members.
- **ABI**: Application Binary Interface — the JSON description of a smart contract's functions and constructor.
- **Bytecode**: The compiled EVM bytecode required to deploy a contract.
- **RLS**: Row Level Security — the Supabase/PostgreSQL policy layer that enforces per-user data access.
- **Variable Picker**: The UI control that presents a dropdown of available Step outputs when a user toggles a parameter to "Use Variable" mode.
- **Lemon Squeezy**: The payment processing and subscription management provider.
- **wagmi**: The React hooks library used for all wallet and on-chain interactions.
- **viem**: The TypeScript Ethereum client used for low-level blockchain calls.
- **Zustand**: The client-side state management library used for the Recipe Builder UI state.
- **TanStack Query**: The server-state management library used for Supabase data fetching and caching.

---

## Requirements

### Requirement 1: User Authentication via Wallet

**User Story:** As a developer, I want to sign in using only my wallet, so that I can access FlowForge without creating a separate account.

#### Acceptance Criteria

1. WHEN a visitor clicks "Connect Wallet" on the sign-in screen, THE Authentication_System SHALL initiate a wallet connection request using wagmi's `useConnect` hook.
2. WHEN a wallet is successfully connected, THE Authentication_System SHALL create or retrieve a Supabase anonymous auth session and store the connected wallet address in the session metadata.
3. WHEN a wallet is disconnected, THE Authentication_System SHALL clear the active Supabase session and redirect the user to the Landing Page.
4. IF a wallet connection request is rejected by the user, THEN THE Authentication_System SHALL return to the sign-in screen without creating a session.
5. WHILE a user session is active, THE Authentication_System SHALL refresh the session token on every page navigation using the Next.js middleware `updateSession` function.
6. THE Authentication_System SHALL support wallet connections from any EIP-1193-compatible browser wallet provider.

---

### Requirement 2: Landing Page

**User Story:** As a prospective user, I want to see a clear explanation of FlowForge's value and a direct path to start building, so that I can quickly understand and adopt the product.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a primary headline, a secondary descriptive sub-headline, and two call-to-action buttons: "Start Building Free" and "View Demo Recipe".
2. WHEN an unauthenticated visitor clicks "Start Building Free", THE Landing_Page SHALL navigate to the sign-in screen.
3. WHEN an authenticated user clicks "Start Building Free", THE Landing_Page SHALL navigate to the My Recipes Dashboard.
4. WHEN any visitor clicks "View Demo Recipe", THE Landing_Page SHALL open a pre-built, read-only shared recipe in the Recipe Builder view.
5. THE Landing_Page SHALL render a three-item value proposition grid displaying "No Local Setup", "Variable Passing", and "Share Recipes".
6. THE Landing_Page SHALL render a competitor comparison table comparing FlowForge against Remix, Thirdweb, and Hardhat Ignition.
7. THE Landing_Page SHALL display completely within 2 500ms on a standard broadband connection without requiring any authenticated API call to render.
8. THE Landing_Page SHALL display correctly on viewport widths from 375px (mobile) to 1920px (desktop).

---

### Requirement 3: My Recipes Dashboard

**User Story:** As an authenticated user, I want to see all my saved Recipes in one place and manage them, so that I can quickly access, edit, run, or delete any Recipe.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the Dashboard, THE Dashboard SHALL fetch and display all Recipes owned by the user, ordered by `updated_at` descending.
2. THE Dashboard SHALL display each Recipe as a card containing: Recipe name, description (truncated to 100 characters if longer), step count, last-modified date, and "Edit" and "Run" action buttons.
3. WHEN the user has no Recipes, THE Dashboard SHALL display an empty state with a "Create your first Recipe" call-to-action and a one-sentence explanation of what a Recipe is.
4. WHEN the user clicks "New Recipe", THE Dashboard SHALL navigate to the Recipe Builder with a new, empty Recipe pre-created in Supabase.
5. WHEN the user clicks "Edit" on a Recipe card, THE Dashboard SHALL navigate to the Recipe Builder loaded with that Recipe's data.
6. WHEN the user clicks "Run" on a Recipe card, THE Dashboard SHALL open the chain-selection modal for that Recipe.
7. WHEN the user clicks the delete action on a Recipe card, THE Dashboard SHALL display a confirmation prompt before deletion.
8. WHEN the user confirms deletion, THE Dashboard SHALL delete the Recipe and all its Steps from Supabase and remove the card from the list without a full page reload.
9. IF a Supabase fetch fails when loading the Dashboard, THEN THE Dashboard SHALL display a human-readable error message and a "Retry" button.
10. WHERE the user is on the Free Tier and already has 3 Recipes, THE Dashboard SHALL display the "New Recipe" button as disabled with a tooltip explaining the limit and linking to the Pricing page.

---

### Requirement 4: Recipe CRUD Operations

**User Story:** As an authenticated user, I want to create, read, update, and delete Recipes, so that I can manage my deployment workflows over time.

#### Acceptance Criteria

1. WHEN a user creates a new Recipe, THE Recipe_Store SHALL insert a row into the `recipes` table with the user's `user_id`, a provided name (1–100 characters), an optional description (0–500 characters), and `is_public: false`.
2. WHEN a user saves edits to a Recipe's name or description in the builder, THE Recipe_Store SHALL update the corresponding `recipes` row and refresh the `updated_at` timestamp.
3. WHEN a user deletes a Recipe, THE Recipe_Store SHALL delete the `recipes` row and CASCADE-delete all associated `recipe_steps` rows.
4. THE Recipe_Store SHALL enforce that a Recipe name is between 1 and 100 characters inclusive; IF a name outside this range is submitted, THEN THE Recipe_Store SHALL return a validation error without writing to the database.
5. THE Recipe_Store SHALL enforce that a Recipe description does not exceed 500 characters; IF a description exceeding this length is submitted, THEN THE Recipe_Store SHALL return a validation error without writing to the database.
6. WHEN a user reads a Recipe, THE Recipe_Store SHALL return only Recipes where `user_id` matches the authenticated user's ID, or where `is_public = true`.
7. IF a user attempts to update or delete a Recipe they do not own, THEN THE Recipe_Store SHALL return an authorization error without modifying the database, enforced by Supabase RLS.
8. WHERE the Free Tier limit of 3 Recipes is reached, THE Recipe_Store SHALL reject a new Recipe creation with a tier-limit error before contacting the database.

---

### Requirement 5: Recipe Builder UI

**User Story:** As an authenticated user, I want a two-panel visual editor where I can author the steps of my Recipe, so that I can define a deployment workflow without writing code.

#### Acceptance Criteria

1. THE Recipe_Builder SHALL render a two-panel layout: a left panel (Step List, approximately 30% width) and a right panel (Step Configuration, approximately 70% width).
2. THE Recipe_Builder SHALL display an ordered list of Steps in the left panel, each showing its step number (1-based), user-defined label, and a type badge ("Deploy" or "Interact").
3. WHEN the user clicks a Step in the left panel, THE Recipe_Builder SHALL load that Step's configuration form in the right panel without navigating away from the page.
4. THE Recipe_Builder SHALL provide an "Add Step" button at the bottom of the left panel that opens a modal prompting the user to choose between "Deploy" and "Interact" step types.
5. WHEN a new Step is added, THE Recipe_Builder SHALL append it to the end of the Step list, assign it a sequential `step_order`, and immediately load its configuration form in the right panel.
6. THE Recipe_Builder SHALL support drag-and-drop reordering of Steps within the left panel using `@dnd-kit/sortable`; WHEN a Step is dropped in a new position, THE Recipe_Builder SHALL update `step_order` values for all affected Steps.
7. WHEN a Step is deleted from the left panel, THE Recipe_Builder SHALL remove it from the list and renumber remaining Steps so that `step_order` values are contiguous starting from 0.
8. THE Recipe_Builder SHALL display a "Save Recipe" button in the top-right of the right panel; WHEN clicked, THE Recipe_Builder SHALL upsert all current Step data to Supabase via the `upsertSteps` data access function.
9. WHEN a save operation completes successfully, THE Recipe_Builder SHALL display a success toast notification.
10. IF a save operation fails, THEN THE Recipe_Builder SHALL display a human-readable error toast and retain the unsaved state in the Zustand store.
11. THE Recipe_Builder SHALL display a "Run Recipe" button in the top-right of the right panel; WHEN clicked, THE Recipe_Builder SHALL open the chain-selection modal.
12. THE Recipe_Builder UI state (all Steps and their Param Configs) SHALL be managed by a Zustand store; no React Context shall be used for builder state.
13. WHEN the user navigates away from the Recipe Builder with unsaved changes, THE Recipe_Builder SHALL display a browser-native confirmation dialog warning about unsaved changes.

---

### Requirement 6: Deploy Step Configuration

**User Story:** As an authenticated user configuring a deploy step, I want to provide the contract's ABI, bytecode, and constructor parameters, so that the execution engine can deploy it correctly.

#### Acceptance Criteria

1. THE Deploy_Step_Form SHALL provide a "Step Label" text input (required, 1–80 characters) for a user-defined display name.
2. THE Deploy_Step_Form SHALL provide a "Contract Name" text input (optional) for display purposes in the execution log.
3. THE Deploy_Step_Form SHALL provide an ABI input that accepts either direct JSON text paste into a textarea or a `.json` file upload.
4. WHEN ABI input is provided, THE Deploy_Step_Form SHALL parse the ABI using the `parseAbi` utility and extract the constructor definition; IF the ABI is invalid JSON or is not an array, THEN THE Deploy_Step_Form SHALL display an inline validation error.
5. THE Deploy_Step_Form SHALL provide a Bytecode input that accepts either direct hex text paste into a textarea or a `.bin` file upload.
6. IF the bytecode value is provided but does not begin with `0x`, THEN THE Deploy_Step_Form SHALL display an inline validation error.
7. WHEN a valid ABI with a constructor is parsed, THE Deploy_Step_Form SHALL dynamically render one Param Config row per constructor input parameter, each showing the parameter name and type as a greyed label.
8. WHEN a valid ABI with no constructor or only a zero-argument constructor is parsed, THE Deploy_Step_Form SHALL render a message stating "No constructor parameters required."
9. THE Deploy_Step_Form SHALL display a "Use Variable" toggle beside each constructor parameter value input.
10. WHEN "Use Variable" is toggled on for a parameter, THE Deploy_Step_Form SHALL replace the text input with a Variable Picker dropdown.

---

### Requirement 7: Interact Step Configuration

**User Story:** As an authenticated user configuring an interact step, I want to specify the target contract address (or reference a prior step's deployed address), the function to call, and its parameters, so that the execution engine can invoke the correct contract function.

#### Acceptance Criteria

1. THE Interact_Step_Form SHALL provide a "Step Label" text input (required, 1–80 characters).
2. THE Interact_Step_Form SHALL provide a "Target Address" input with a "Use Variable" toggle; WHEN the toggle is off, THE Interact_Step_Form SHALL accept a plain Ethereum address string; WHEN the toggle is on, THE Interact_Step_Form SHALL replace the text input with a Variable Picker dropdown.
3. THE Interact_Step_Form SHALL provide an ABI input with the same textarea/upload interface as the Deploy Step.
4. WHEN a valid ABI is parsed, THE Interact_Step_Form SHALL populate a "Function Name" dropdown with all non-`view` and non-`pure` functions found in the ABI.
5. WHEN a function is selected from the dropdown, THE Interact_Step_Form SHALL dynamically render one Param Config row per function input parameter, each showing the parameter name and type as a greyed label.
6. THE Interact_Step_Form SHALL display a "Use Variable" toggle beside each function parameter value input.
7. WHEN "Use Variable" is toggled on for a parameter, THE Interact_Step_Form SHALL replace the text input with a Variable Picker dropdown.
8. IF no function is selected but the user attempts to save the step, THEN THE Interact_Step_Form SHALL display a validation error on the Function Name field.

---

### Requirement 8: Variable Passing Between Steps

**User Story:** As an authenticated user, I want to bind a step's parameter to the output of a previous step, so that I can wire together dependent contracts without manually copying addresses.

#### Acceptance Criteria

1. THE Variable_Picker SHALL populate its dropdown with one entry per previous Step that has a `deploy` type, exposing two bindable outputs per Step: `Step N → Contract Address` and `Step N → Transaction Hash`.
2. WHEN the user selects a variable from the Variable Picker, THE Variable_Picker SHALL store the selection as a Param Config with `isVariable: true` and `variableRef` set to the canonical form `step_N.contractAddress` or `step_N.txHash` (where N is the zero-based `step_order`).
3. WHEN a Step is reordered, THE Recipe_Builder SHALL update all Variable References in all downstream Param Configs to reflect the new `step_order` values, so that no reference becomes stale.
4. WHEN a Step is deleted and other Steps hold Variable References to it, THE Recipe_Builder SHALL display an inline warning on every affected Param Config row indicating that its variable reference is broken.
5. THE `resolveStepParam` utility function SHALL accept a single `StepParamConfig` and the array of completed `StepResult` objects; WHEN `isVariable` is `true`, THE `resolveStepParam` SHALL extract the referenced step index and field name from `variableRef` and return the corresponding value from `StepResult`; WHEN `isVariable` is `false`, THE `resolveStepParam` SHALL return `paramConfig.value` unchanged.
6. IF `resolveStepParam` is called with a `variableRef` that does not match any completed `StepResult`, THEN THE `resolveStepParam` SHALL throw a typed `VariableResolutionError` with a human-readable message identifying the unresolved reference.
7. FOR ALL valid `StepParamConfig` values where `isVariable` is `false`, resolving then re-resolving the same param with the same step results SHALL produce the same output (idempotence property).

---

### Requirement 9: Recipe Execution Engine

**User Story:** As an authenticated user, I want to run a Recipe against a chosen EVM chain, so that all steps execute sequentially in the correct order and I can see real-time progress.

#### Acceptance Criteria

1. WHEN the user confirms a chain selection and initiates execution, THE Execution_Engine SHALL create a new `executions` row in Supabase with `status: 'running'` and `step_results: []` before processing any Step.
2. THE Execution_Engine SHALL process Steps in ascending `step_order` sequence, one at a time; it SHALL NOT begin Step N+1 until Step N has reached a terminal state (success or failure).
3. WHEN executing a `deploy` Step, THE Execution_Engine SHALL resolve all constructor Param Configs using `resolveStepParam`, then submit a contract deployment transaction via wagmi's `useDeployContract` hook using the resolved ABI and bytecode.
4. WHEN executing an `interact` Step, THE Execution_Engine SHALL resolve the target address and all function Param Configs, then submit a contract function call via wagmi's `useWriteContract` hook.
5. WHEN a Step completes successfully, THE Execution_Engine SHALL immediately call `updateExecutionStepResult` to persist the `StepResult` (including `contractAddress` or `txHash`) to the `executions.step_results` JSONB column before proceeding to the next Step.
6. IF a Step fails (transaction reverted, RPC error, or user rejection), THEN THE Execution_Engine SHALL record a `StepResult` with `status: 'failed'` and a human-readable `errorMessage`, call `finalizeExecution` with `status: 'partial'`, and halt execution of subsequent Steps.
7. WHEN all Steps complete successfully, THE Execution_Engine SHALL call `finalizeExecution` with `status: 'success'` and record `completedAt`.
8. THE Execution_Engine SHALL expose the following state to the UI: current step index, per-step status, per-step result (address / tx hash), and overall execution status.
9. THE Execution_Engine SHALL store each completed Step's result in React hook state so that Variable References in subsequent Steps can be resolved without re-querying Supabase.
10. IF the user's wallet is not connected when execution is initiated, THEN THE Execution_Engine SHALL return an error state prompting the user to connect their wallet before retrying.
11. IF the user's wallet is connected to a chain that does not match the selected execution chain, THEN THE Execution_Engine SHALL prompt the user to switch networks via wagmi's `useSwitchChain` hook before proceeding.

---

### Requirement 10: Execution Progress Display

**User Story:** As an authenticated user running a Recipe, I want to see a full-screen, real-time progress view for the active execution, so that I can monitor each step and understand what happened when it completes or fails.

#### Acceptance Criteria

1. THE Execution_Progress_Screen SHALL render immediately upon execution start and display the Recipe name and target chain name at the top.
2. THE Execution_Progress_Screen SHALL render one status row per Step, always showing all Steps with their statuses at once (not just the active one).
3. THE Execution_Progress_Screen SHALL display each Step's status using a distinct visual indicator: grey for `pending`, a pulsing amber animation for `running`, solid green with a checkmark icon for `success`, and red with an error icon for `failed`.
4. WHEN a Step completes with a `deploy` result, THE Execution_Progress_Screen SHALL display the deployed contract address as a clickable link to the chain's block explorer address page.
5. WHEN a Step completes with an `interact` result, THE Execution_Progress_Screen SHALL display the transaction hash as a clickable link to the chain's block explorer transaction page.
6. WHEN a Step fails, THE Execution_Progress_Screen SHALL display the human-readable `errorMessage` in red text beneath the failed Step row.
7. WHEN all Steps complete successfully, THE Execution_Progress_Screen SHALL display an "Execution Complete" heading and render three action buttons: "Copy All Addresses", "View Execution History", and "Run Again".
8. WHEN the user clicks "Copy All Addresses", THE Execution_Progress_Screen SHALL copy a formatted plain-text list of all Step labels and their deployed contract addresses to the clipboard.
9. WHEN a partial or failed execution ends, THE Execution_Progress_Screen SHALL display a "Partial Execution" or "Execution Failed" heading and render a "View Execution History" button.
10. THE Execution_Progress_Screen SHALL never display raw RPC error strings, Supabase error codes, or JavaScript stack traces to the user.

---

### Requirement 11: Execution History

**User Story:** As an authenticated user, I want to view the history of all past Recipe executions, so that I can audit what was deployed, on which chain, and what addresses were produced.

#### Acceptance Criteria

1. THE Execution_History_Screen SHALL display a table of all past executions for the authenticated user, ordered by `started_at` descending.
2. THE Execution_History_Screen SHALL display the following columns per execution row: Execution ID (truncated UUID), Recipe name, Chain name, Start date/time, Status badge, and an "Inspect" action.
3. WHEN the user clicks "Inspect" on an execution row, THE Execution_History_Screen SHALL display the full step-by-step result breakdown in a read-only view, identical in layout to the Execution Progress Screen but without the action buttons.
4. THE Execution_History_Screen SHALL display status badges with distinct colors: grey for `pending`, amber for `running`, green for `success`, amber-orange for `partial`, and red for `failed`.
5. THE Execution_History_Screen SHALL provide a per-execution "Export CSV" button; WHEN clicked, THE Execution_History_Screen SHALL download a CSV file containing: Step Label, Step Type, Contract Address (if deploy), Transaction Hash, Status, and Completed At.
6. IF a Supabase fetch fails when loading execution history, THEN THE Execution_History_Screen SHALL display a human-readable error message and a "Retry" button.
7. WHEN no executions exist for the user, THE Execution_History_Screen SHALL display an empty state message indicating that no executions have been run yet.

---

### Requirement 12: Chain Selection

**User Story:** As an authenticated user, I want to select the target EVM chain before running a Recipe, so that I can deploy to the correct network.

#### Acceptance Criteria

1. THE Chain_Selector SHALL display all nine Supported Chains: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, and BlockDAG Mainnet.
2. THE Chain_Selector SHALL visually distinguish testnet chains from mainnet chains using a "Testnet" badge.
3. WHERE the user is on the Free Tier, THE Chain_Selector SHALL disable all mainnet chain options and display a tooltip on each disabled option explaining the testnet-only restriction and linking to the Pricing page.
4. WHEN the user selects a mainnet chain, THE Chain_Selector SHALL display a prominent fee-awareness warning before the "Confirm and Execute" button.
5. WHEN the user confirms a chain selection, THE Chain_Selector SHALL close and pass the selected `chainId` and `chainName` to the Execution Engine.
6. THE Chain_Selector SHALL read all chain definitions from `src/config/chains.ts`; no chain ID, name, or explorer URL SHALL be hardcoded in any other file.

---

### Requirement 13: Recipe Sharing

**User Story:** As a Builder or Team Tier user, I want to share a Recipe via a public URL, so that teammates or the community can view and clone my workflow.

#### Acceptance Criteria

1. WHEN a Builder or Team Tier user toggles "Make Public" on a Recipe, THE Recipe_Store SHALL update `is_public` to `true` in the `recipes` table.
2. WHEN `is_public` is `true`, THE Recipe_Builder SHALL display a shareable URL of the form `/recipe/shared/[id]` and a "Copy Link" button.
3. WHEN any user (authenticated or unauthenticated) visits `/recipe/shared/[id]`, THE Shared_Recipe_Viewer SHALL render the Recipe and all its Steps in a read-only view without editable form fields.
4. WHEN an authenticated user views a shared Recipe, THE Shared_Recipe_Viewer SHALL display a "Clone Recipe" button; WHEN clicked, THE Shared_Recipe_Viewer SHALL create a copy of the Recipe and all its Steps under the viewer's own `user_id` and navigate to the Recipe Builder with the cloned Recipe.
5. IF a shared Recipe's `is_public` field is set back to `false`, THEN THE Shared_Recipe_Viewer SHALL return a "Recipe not found or no longer public" message to visitors loading that URL, enforced by Supabase RLS.
6. WHERE the user is on the Free Tier and attempts to toggle "Make Public", THE Recipe_Builder SHALL prevent the action, display a tooltip explaining that sharing requires the Builder Tier, and link to the Pricing page.

---

### Requirement 14: Pricing and Subscription Tiers

**User Story:** As a user, I want to understand the pricing tiers and upgrade my plan, so that I can access the features I need.

#### Acceptance Criteria

1. THE Pricing_Page SHALL display all three tiers (Free, Builder at $49/month, Team at $99/month) with a clear feature comparison table.
2. THE Pricing_Page SHALL display an annual billing toggle; WHEN annual is selected, THE Pricing_Page SHALL show 20% reduced prices (Builder at $39/month, Team at $79/month) and the equivalent annual total.
3. WHEN an unauthenticated visitor clicks an upgrade CTA, THE Pricing_Page SHALL redirect to the sign-in screen with a post-authentication redirect back to the Pricing page.
4. WHEN an authenticated user on the Free Tier clicks "Upgrade to Builder", THE Pricing_Page SHALL initiate a Lemon Squeezy checkout session for the Builder plan using the Lemon Squeezy API.
5. WHEN a Lemon Squeezy webhook fires a `subscription_created` or `subscription_updated` event, THE Webhook_Handler SHALL update the user's subscription tier in Supabase auth metadata and respond with HTTP 200.
6. IF a Lemon Squeezy webhook payload fails signature verification, THEN THE Webhook_Handler SHALL respond with HTTP 401 and take no action.
7. THE Pricing_Page SHALL accurately reflect the user's current active plan when the user is authenticated.

---

### Requirement 15: Database Persistence and Data Integrity

**User Story:** As a developer of FlowForge, I want all user data to be correctly persisted and protected, so that the application is reliable and users' work is safe.

#### Acceptance Criteria

1. THE Database_Schema SHALL contain exactly three tables: `recipes`, `recipe_steps`, and `executions`; no additional tables SHALL be created at launch.
2. THE `recipe_steps` table SHALL enforce `UNIQUE(recipe_id, step_order)` so that no two Steps in the same Recipe share the same order position.
3. THE Database_Schema SHALL enforce `ON DELETE CASCADE` from `recipes` to `recipe_steps` and from `recipes` to `executions`, so that deleting a Recipe removes all its Steps and Executions.
4. THE Database_Schema SHALL enforce RLS on all three tables as defined in the Glossary: own-data CRUD for all tables, plus public read access on `recipes` where `is_public = true`.
5. WHEN any Supabase data access function encounters an error, THE Data_Access_Layer SHALL return a `{ data: null, error: string }` response with a human-readable error message; it SHALL NOT throw unhandled exceptions or return raw Supabase error objects to calling code.
6. THE Data_Access_Layer SHALL accept a Supabase client instance as its first argument for all functions, enabling both server-side (Server Components) and client-side (Client Components) usage without duplication.
7. WHEN `upsertSteps` is called with an ordered array of Steps, THE Data_Access_Layer SHALL perform an `upsert` with `onConflict: 'id'`, replacing the full Step configuration for any existing Step ID.

---

### Requirement 16: Application Architecture and Code Quality

**User Story:** As a developer maintaining FlowForge, I want the codebase to follow strict quality standards, so that it remains maintainable and extensible as the product grows.

#### Acceptance Criteria

1. THE Codebase SHALL use TypeScript with `strict: true` enabled in `tsconfig.json`; no `any` types and no `@ts-ignore` comments SHALL appear in production code.
2. THE Codebase SHALL use `viem` exclusively for all blockchain data types and low-level calls; no Ethers.js import SHALL appear anywhere in the codebase.
3. THE Codebase SHALL use Zustand for Recipe Builder UI state and TanStack Query v5 for all Supabase server state; no React Context SHALL be used for recipe builder state.
4. ALL chain IDs, RPC URLs, and block explorer URLs SHALL be defined exclusively in `src/config/chains.ts`; no chain identifier SHALL be hardcoded in any other file.
5. THE Codebase SHALL use Tailwind utility classes for all styling; no inline styles and no CSS-in-JS patterns SHALL appear in the codebase.
6. THE Codebase SHALL not contain barrel `index.ts` re-export files inside feature folders unless explicitly required.
7. WHEN a UI component can render in a loading, empty, or error state, THE Component SHALL visually handle all three states.
8. ALL user-facing error messages SHALL be human-readable; raw RPC error strings, Supabase error codes, and JavaScript stack traces SHALL be logged to the console and replaced with plain-language messages in the UI.
