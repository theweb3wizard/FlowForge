# FlowForge — Agent Handoff Memory

> Persistent context for AI agents working on FlowForge.
> Last updated: 2026-07-02

---

## Project Status

| Field | Value |
|-------|-------|
| **Status** | Production-ready. Beta launched. |
| **Build** | ✅ Passes cleanly — zero type errors, zero build errors |
| **Stack** | Next.js 16 (Turbopack), Neon Postgres + Drizzle ORM, Neon Auth, wagmi v2, Tailwind CSS |
| **Dev server** | `npm run dev` (port 9002) |

---

## Key Architecture Decisions

### Lazy Proxy pattern
Both `db` and `auth` modules use JavaScript Proxies that defer initialization until first property access. This prevents build-time crashes when `DATABASE_URL` or Neon Auth env vars are absent during `next build`.

### Database
- **ORM:** Drizzle (schema in `src/lib/db/schema.ts`)
- **Client:** Lazy-initialized via Proxy (`src/lib/db/index.ts`)
- **Tables:** recipes, recipe_steps, executions, deployments, generation_log
- **Connection:** `@neondatabase/serverless` via `neon-http`

### Auth
- **Provider:** Neon Auth (Better Auth compatible)
- **Server:** `src/lib/auth/server.ts` — lazy Proxy, exports `getSession()`, `getUser()`
- **Client:** `src/lib/auth/client.ts` — `createAuthClient()`
- **Middleware:** `src/proxy.ts` — lazy `auth.middleware()` call

### Server Actions
- `src/lib/actions/recipeActions.ts` — saveRecipe, togglePublic, cloneRecipe
- `src/lib/actions/executionActions.ts` — createExecution, updateStepResult, finalize

### UI / Design
- **Fonts:** Instrument Sans (body) + Plus Jakarta Sans (headings) via CSS `@import`
- **Theme:** Light + Dark modes with `prefers-color-scheme` default + manual toggle
- **Toggle:** `src/components/common/ThemeToggle.tsx` — persists to `localStorage`
- **CSS:** CSS custom properties for colors, radii, shadows, gradients

---

## Build Commands

```bash
npm run build           # Production build (Turbopack)
npx tsc --noEmit        # Fast type check (separate from build)
npm run lint            # ESLint
npx drizzle-kit push    # Push schema changes to Neon
npx drizzle-kit studio  # Open Drizzle Studio (DB browser)
```

---

## Environment Variables

```
DATABASE_URL              — Neon Postgres connection string
NEON_AUTH_BASE_URL        — Neon project base URL
NEON_AUTH_COOKIE_SECRET   — Cookie signing secret (min 32 chars)
OPENROUTER_API_KEY        — OpenRouter API key (AI features)
NEXT_PUBLIC_APP_URL       — App URL (http://localhost:9002 for dev)
```

---

## File Map (Key Files)

```
src/lib/db/schema.ts           — Drizzle schema (5 tables)
src/lib/db/index.ts            — Lazy Proxy Drizzle client
src/lib/db/recipes.ts          — Recipe data access
src/lib/db/recipeSteps.ts      — Step data access
src/lib/db/executions.ts       — Execution data access
src/lib/auth/server.ts         — Lazy Proxy Neon Auth server
src/lib/auth/client.ts         — Neon Auth client
src/lib/actions/recipeActions.ts   — Recipe server actions
src/lib/actions/executionActions.ts — Execution server actions
src/proxy.ts                   — Next.js 16 middleware (lazy auth)
src/app/globals.css            — Design tokens (colors, fonts, animations)
src/components/common/ThemeToggle.tsx — Light/dark toggle
```

---

## Known Considerations

1. **npm registry** can be unreliable (ECONNRESET). Use `--prefer-offline` if cached.
2. **Neon Auth is in Beta** — session handling may change upstream.
3. **No payment system** — product is 100% free and open source.
4. **No SIWE** — wallet address is the sole identity via Neon Auth.
