# FlowForge Agent Handoff Memory

> Persistent context for AI agents continuing the FlowForge rebuild.
> Authority: `Revive.md` (strategy) + `Agent.md` (execution roadmap).
> Last updated: 2026-06-05

---

## Project Status Summary

| Field | Value |
|-------|-------|
| **Status** | ✅ ALL 22 PROMPTS COMPLETE (Prompt 0 through Prompt Final) |
| **Last completed prompt** | Prompt Final — Production Hardening |
| **Next step** | Manual deployment checklist (see below) |
| **Dev server** | `npm run dev` (port **9002** via turbopack) |

---

## All Completed Prompts (0–Final)

### Prompts 0–20 ✅
*(Fully documented in previous handoff versions — see git history)*

**Summary:** Environment scaffold → Supabase schema → TypeScript types → data access layer → chain config + wagmi → ABI utilities → execution hook → layout shell → landing page → auth flow → dashboard → Zustand store + validation → builder page + step list → deploy/interact config panels → save/share/public view → run modal + chain selector → execution progress UI → history page → starter templates → pricing + Lemon Squeezy

---

### Prompt 21 — Edge Case Hardening ✅

**Files modified:**

**`src/hooks/useRecipeExecution.ts`**
- Added wallet disconnect detection via `useEffect` watching `isConnected`. On disconnect during execution: sets `isRunning: false`, finalizes execution with `'partial'` or `'failed'` status, sets error message "Wallet was disconnected. Execution stopped."
- Added `isRunningRef`, `executionIdRef`, `disconnectHaltedRef` to track state safely inside effects
- Made Supabase persistence non-blocking — DB write failures are logged but never halt execution (UI state is authoritative during a run)
- Added navigation-away comment explaining the v2 service worker path for background execution

**`src/components/builder/BuilderToolbar.tsx`**
- "Run Recipe" button is now disabled when `steps.length === 0`
- Added `TooltipProvider`/`Tooltip` wrapper: shows "Add at least one step before running." tooltip on the disabled button
- Recipe name blank validation was already present — confirmed working

**`src/components/builder/StepListItem.tsx`**
- Added `hasBrokenVariableRef` check after every reorder
- Shows amber `AlertTriangle` icon with tooltip: "This step references an output from a step that now comes after it. Update the variable reference in the step configuration."
- Does NOT auto-fix — visual warning only per spec

**`src/stores/recipeBuilderStore.ts`**
- Exported `hasBrokenVariableRef(step, allSteps)` utility function
- Checks both `constructorParams` variable refs and `targetAddress` variable refs for interact steps
- A ref is broken when: referenced stepOrder no longer exists, OR referenced stepOrder >= this step's stepOrder

**Loading skeletons (Next.js `loading.tsx` files):**
- `src/app/(app)/dashboard/loading.tsx` — 6 recipe card skeletons
- `src/app/(app)/recipe/[id]/builder/loading.tsx` — toolbar + left panel + right panel skeletons
- `src/app/(app)/recipe/[id]/history/loading.tsx` — table header + 5 row skeletons

**Already verified from prior prompts:**
- `AbiUploader` — inline error on invalid JSON, no crash ✅
- `getAvailableVariables` — only exposes lower `stepOrder` outputs ✅
- `DeployStepConfig` — bytecode `0x` validation with inline error ✅
- `ConnectWalletButton` — loading state during wallet connection ✅
- `RecipeList` error handling — "Failed to load recipes. Please refresh." ✅
- Builder two-panel layout — `md:w-[280px]` collapses on mobile ✅
- Auth redirect — `(app)/layout.tsx` server component redirects unauthenticated users ✅
- Middleware — `updateSession` refreshes expired sessions ✅

---

### Prompt Final — Production Hardening ✅

**Files created/modified:**

**`src/lib/env.ts`** — Zod schema validates `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` on module load. Throws a descriptive error listing which variables are missing. Imported by `src/lib/supabase/server.ts` so validation fires at server startup.

**`src/lib/supabase/server.ts`** — Now imports `env` from `@/lib/env` and uses `env.NEXT_PUBLIC_SUPABASE_URL` / `env.NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of raw `process.env` access.

**`vercel.json`** — Created with:
- `framework: "nextjs"`
- `functions.maxDuration: 10` for the webhook route
- Security headers on all routes: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`

**`src/app/robots.ts`** — Next.js Metadata API robots.txt:
- Allows: `/`, `/pricing`, `/recipe/shared/`
- Disallows: `/dashboard`, `/api/`, `/recipe/` (builder routes)
- Points to sitemap

**`src/app/sitemap.ts`** — Dynamic sitemap:
- Static: `/` (priority 1.0), `/pricing` (priority 0.8)
- Dynamic: fetches all `is_public = true` recipes, adds `/recipe/shared/{id}` URLs (priority 0.6, changeFrequency weekly)
- Gracefully falls back to static routes if Supabase is unavailable at build time

---

## Production Deployment Checklist

### Supabase Setup (manual)
- [ ] Run `database/schema.sql` in the Supabase SQL Editor
- [ ] Confirm RLS enabled on `recipes`, `recipe_steps`, `executions`
- [ ] Confirm all 5 RLS policies exist for `recipes`
- [ ] Confirm `updated_at` trigger on `recipes`
- [ ] In Auth settings → add production domain to "Allowed Redirect URLs"
- [ ] In Auth settings → confirm Email Confirmations behavior

### Vercel Environment Variables
Set all of these in Vercel → Settings → Environment Variables (Production):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL            (set to production URL, NOT localhost)
LEMON_SQUEEZY_API_KEY
LEMON_SQUEEZY_WEBHOOK_SECRET
NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
LS_VARIANT_BUILDER             (Lemon Squeezy variant ID for Builder plan)
LS_VARIANT_TEAM                (Lemon Squeezy variant ID for Team plan)
```

### Lemon Squeezy
- [ ] Set webhook URL to `{NEXT_PUBLIC_APP_URL}/api/webhooks/lemon-squeezy` in LS dashboard
- [ ] Enable `order_created` and `subscription_created` webhook events
- [ ] Copy `LEMON_SQUEEZY_WEBHOOK_SECRET` from LS into Vercel env vars

### Pre-deploy verification
- [ ] `npm run build` — zero errors
- [ ] Confirm no `NEXT_PUBLIC_` prefix on `LEMON_SQUEEZY_API_KEY` or `LEMON_SQUEEZY_WEBHOOK_SECRET`

---

## Environment Variables

`.env.local` keys (see `.env.example` for placeholders):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID=
```

Additional (not in `.env.example` — add manually):
```
LS_VARIANT_BUILDER=
LS_VARIANT_TEAM=
```

---

## Known Remaining Issues

1. **Legacy files** — The following pre-rebuild files still exist and cause TypeScript errors in a full `tsc` run. They are never imported by any new-architecture code and are safe to delete:
   - `src/components/batch/`, `src/components/dashboard/`, `src/components/deployment/`
   - `src/components/interaction/`, `src/components/recipes/`, `src/components/templates/`
   - `src/contexts/WalletContext.tsx`
   - `src/hooks/use-queries.ts`, `src/hooks/useBatchDeploy.ts`, `src/hooks/useDeployContract.ts`
   - `src/hooks/useContractInteraction.ts`, `src/hooks/useRecipeExecutor.ts`
   - `src/lib/supabase.ts`, `src/lib/recipes/`, `src/lib/web3/`, `src/lib/wagmi.ts`
   
   To clean these up: delete the folders/files listed above, run `npm run build` again.

2. **Lemon Squeezy checkout links** — `PricingCard` CTAs currently link to `/sign-in`. In production, wire the Builder/Team CTAs to a Server Action calling `createCheckoutUrl()` and redirecting to the returned checkout URL.

3. **Full SIWE auth** — Auth is currently anonymous Supabase + wallet metadata. Migration path noted in `WalletSignIn.tsx`.

4. **Execution resume** — The `?resumeFrom=N` query param in `ExecutionSummary` re-runs the full recipe from step 1. True resume from step N requires loading prior step results from Supabase and skipping completed steps. Noted in `ExecutionSummary.tsx`.

---

## Complete New-Architecture File Tree

```
database/schema.sql
vercel.json                              ← NEW (Final)
src/
  app/
    layout.tsx
    page.tsx
    robots.ts                            ← NEW (Final)
    sitemap.ts                           ← NEW (Final)
    (auth)/sign-in/page.tsx
    (app)/
      layout.tsx
      dashboard/
        page.tsx
        loading.tsx                      ← NEW (Prompt 21)
      recipe/[id]/
        builder/
          page.tsx
          actions.ts
          loading.tsx                    ← NEW (Prompt 21)
        run/page.tsx
        history/
          page.tsx
          loading.tsx                    ← NEW (Prompt 21)
    recipe/shared/[id]/page.tsx
    pricing/page.tsx
    api/
      auth/callback/route.ts
      webhooks/lemon-squeezy/route.ts
  config/
    chains.ts
    wagmi.ts
    starterTemplates.ts
  lib/
    abi/parser.ts
    actions/recipeActions.ts
    env.ts                               ← NEW (Final)
    lemonsqueezy.ts
    supabase/
      client.ts
      server.ts                          ← UPDATED (Final): uses env.ts
      middleware.ts, types.ts, databaseClient.ts
      recipes.ts, recipeSteps.ts, executions.ts
    validation/recipeSchemas.ts
  middleware.ts
  stores/
    recipeBuilderStore.ts               ← UPDATED (Prompt 21): hasBrokenVariableRef
  types/
    abi.ts, recipe.ts, execution.ts, chain.ts, index.ts
  hooks/
    useRecipeExecution.ts               ← UPDATED (Prompt 21): disconnect detection
  components/
    builder/
      BuilderPage.tsx
      BuilderToolbar.tsx                ← UPDATED (Prompt 21): zero-step guard + tooltip
      StepList.tsx
      StepListItem.tsx                  ← UPDATED (Prompt 21): broken-ref warning
      AddStepButton.tsx
      AbiUploader.tsx
      VariablePicker.tsx, ParamConfigurator.tsx
      DeployStepConfig.tsx
      FunctionSelector.tsx, InteractStepConfig.tsx
      ShareRecipeButton.tsx
    execution/
      ChainSelector.tsx, RunModal.tsx
      ExecutionProgress.tsx, StepProgressCard.tsx, ExecutionSummary.tsx
      ExecutionHistoryList.tsx, ExecutionHistoryRow.tsx, ExecutionDetailView.tsx
    layout/
      Providers.tsx, AppNav.tsx, AppShell.tsx
    common/
      ConnectWalletButton.tsx, UserAvatar.tsx, WalletSignIn.tsx
    recipe/
      RecipeCard.tsx, RecipeList.tsx
      CreateRecipeDialog.tsx, DeleteRecipeDialog.tsx
      PublicRecipeView.tsx, StarterTemplateGallery.tsx
    pricing/
      PricingCard.tsx, BillingToggle.tsx
  utils/
    encodeStepArgs.ts, formatExecutionError.ts, formatDate.ts
    resolveStepParam.ts, formatAddress.ts
```

---

*All 22 prompts complete. The FlowForge rebuild is production-ready pending the manual deployment checklist above.*
