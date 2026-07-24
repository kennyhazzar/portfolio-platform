# 01 — Monorepo & infra: adding `apps/frontend`

> Builds on `00-audit.md` §9–10. Decides how the Next.js app is added without disturbing the existing NestJS monorepo-mode setup, and where the admin panel lives. Blocks `04-frontend-architecture.md` and `05-admin-panel.md`.

## 1. Workspace restructuring

**Change:** add a `packages:` glob to `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'

overrides:
  # ...unchanged
```

Why this is safe: `apps/backend` and `apps/auth-service` have no `package.json` of their own today — pnpm silently skips workspace-glob directories without one. So this change is additive; the existing single-root-`package.json` + NestJS-CLI-monorepo-mode setup (`nest-cli.json`) keeps working exactly as it does now. Only the new `apps/frontend` (which *will* have its own `package.json`) actually becomes a workspace project.

**Do not** add `libs/*` to the glob — `libs/auth`, `libs/common`, `libs/contracts`, `libs/database` are TS path-alias libs consumed via `@libs/*` imports inside the single Nest program, not independent npm packages. Adding a glob there would make pnpm expect `package.json` files that don't exist.

**New `apps/frontend`:**
- `apps/frontend/package.json` — `"name": "@portfolio/frontend"`, own `next`, `react`, `react-dom`, `tailwindcss`, shadcn/ui deps.
- `apps/frontend/tsconfig.json` — Next-generated shape (`moduleResolution: bundler`, `jsx: preserve`, `plugins: [{ "name": "next" }]`, `noEmit: true`). **Does not extend** the root `tsconfig.json` — that file is tuned for Nest (`module: commonjs`, `emitDecoratorMetadata`, experimental decorators) and sharing it buys nothing but coupling. The two tsconfig trees stay fully independent, joined only by the pnpm workspace.
- `apps/frontend/next.config.ts` — standard Next config, `output: 'standalone'` (for the Docker build, see §4).

**Root `package.json` convenience scripts** (added, existing scripts untouched):
```json
"dev:frontend": "pnpm --filter @portfolio/frontend dev",
"build:frontend": "pnpm --filter @portfolio/frontend build",
"start:frontend": "pnpm --filter @portfolio/frontend start"
```

**Compatibility check to run once frontend deps are added:** `pnpm-workspace.yaml`'s existing `overrides` block force-pins `typescript: '>=6.0.3'` workspace-wide — verify this satisfies whatever TS range Next.js/the installed React version expects before adding frontend deps. `pnpm-lock.yaml` will also gain a new workspace importer entry — expect its shape to change even before frontend has any dependencies of its own.

## 2. Things that *will* break, and their fixes

| # | What breaks | Why | Fix |
|---|---|---|---|
| 1 | `jest.config.cjs` — `testMatch: ['<rootDir>/apps/**/*.spec.ts']` | Would pick up future `apps/frontend/**/*.spec.ts` files under a Node/ts-jest/commonjs config with no `jsdom` — wrong environment for React component tests | Narrow to `['<rootDir>/apps/backend/**/*.spec.ts', '<rootDir>/apps/auth-service/**/*.spec.ts']`. Frontend gets its own test runner/config (Vitest or Jest+`jsdom`) driven by its own `package.json` script, run separately. |
| 2 | `eslint.config.mjs` — `languageOptions.sourceType: 'commonjs'` applies globally, no React/JSX/Next rules | Frontend is ESM + JSX; backend-only assumption leaks into frontend files | Add a scoped override block: `{ files: ['apps/frontend/**/*.{ts,tsx}'], ...languageOptions: { sourceType: 'module' }, plugins/rules for react-hooks, jsx-a11y, `@next/eslint-plugin-next` }`. `projectService: true` (already set) should auto-resolve the nearest `tsconfig.json` per linted file once `apps/frontend/tsconfig.json` exists — **verify this in practice** when frontend is scaffolded, don't assume. |
| 3 | `nest-cli.json` — must **never** gain a `projects.frontend` entry | Next isn't a Nest app; registering it would make `nest build`/`nest start` (no target arg) ambiguous or try to treat Next source as a Nest project | No change to `nest-cli.json` at all. |
| 4 | No CI pipeline exists yet (confirmed: no `.github/workflows/`) | N/A — nothing to break | Not urgent for a solo project; noted here so it's not forgotten if CI is added later (would need separate lint/test/build jobs per app, keyed off path filters). |

## 3. Admin panel location — decision

**Decision: the admin panel is a route group inside `apps/frontend` (e.g. `app/(admin)/admin/*`), not a second app.**

Reasoning:
- One Next.js app, one Docker image, one deploy — matches the "don't over-engineer for a solo site" thread already established for Analytics.
- Shares the design system (Tailwind + shadcn/ui components) between the public site and the admin UI — CRUD forms/tables benefit from the same primitives already built for the public site's content displays.
- The backend's `auth.mode: HYBRID` (see `config.production.yaml.example`) already issues `httpOnly` cookies (`accessToken`/`refreshToken`, `sameSite: strict`) for browser clients — `httpOnly` blocks client-side JS from reading the cookie, but Next.js middleware runs server-side and can read the `Cookie` header fine, so route protection for `/admin/*` is achievable without a second app or a different auth mechanism.
- Downside accepted: the exact verification approach (Next middleware verifying the JWT locally vs. calling a lightweight backend session-check endpoint) is **not** decided here — that's an auth-flow detail, deferred to `04-frontend-architecture.md` where the rest of the data-fetching/locale contract is designed.

This decision only fixes *where the admin code lives*; `05-admin-panel.md` still designs the screens themselves.

## 4. Docker

New `docker/frontend.Dockerfile`, following the existing two-stage convention (`build` → `runtime`) seen in `docker/backend.Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @portfolio/frontend build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /app/apps/frontend/public ./apps/frontend/public
EXPOSE 3001
USER node
CMD ["node", "apps/frontend/server.js"]
```

(Exact paths depend on Next's `output: 'standalone'` layout once actually scaffolded — this is the shape, not a guarantee of the final file, since the app doesn't exist yet.)

New compose service, matching the existing style (`context: ..`, `restart: unless-stopped`, `networks: [backend]`, healthcheck via `node -e fetch(...)`):

```yaml
  frontend:
    build:
      context: ..
      dockerfile: docker/frontend.Dockerfile
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    environment:
      INTERNAL_API_BASE_URL: ${INTERNAL_API_BASE_URL:-http://backend:3000}
    ports:
      - '127.0.0.1:${FRONTEND_PORT:-3001}:3001'
    healthcheck:
      test: ['CMD', 'node', '-e', "fetch('http://localhost:3001').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 5s
      timeout: 5s
      retries: 30
      start_period: 10s
    networks: [backend]
```

**Revised by `04-frontend-architecture.md` §3/§10:** only one API base URL is needed, `INTERNAL_API_BASE_URL`, used for every server-side fetch from Next Server Components/Server Actions/Route Handlers, container-to-container (`http://backend:3000`). The frontend architecture doc settled on the browser never calling the backend directly at all — the handful of things that originate in the browser (view counting, comment submission, the captcha flow) are each proxied through a thin Next Route Handler instead — so a separate publicly-exposed `NEXT_PUBLIC_API_BASE_URL` turned out not to be needed. This also means the CORS question flagged below never has to be answered: the backend never receives a browser-origin request in the first place.

**Real gap found in Phase 5, not anticipated here: `RUN pnpm --filter @portfolio/frontend build` cannot reach `http://backend:3000` at all.** `docker compose build` (and plain `docker build`) runs each build stage in an isolated context with no compose networking — `depends_on`/`networks` only take effect at `up`. Several public pages fetch backend data with time+tag-based revalidation (`04` §5), which makes Next.js attempt to statically prerender them *during* `next build`; with no backend reachable, the build fails outright. This had been silently broken since the pages were first built (Phase 3) — local development never noticed because `next build`/`next dev` run directly on the host, which *can* reach the Docker-exposed backend port. Fixed by adding `export const dynamic = "force-dynamic"` to the affected pages (home, about, cases list, posts list) so they render per-request instead of at build time — the fetch-level Data Cache (`revalidate`/`revalidateTag`) is unaffected, so `04` §5's on-demand revalidation design still holds. See `06-master-roadmap.md` §3 (Phase 5) for the full account, including a related `.env.local`-in-build-context issue fixed at the same time.

## 5. Summary of decisions this doc closes

1. `pnpm-workspace.yaml` gets a `packages: ['apps/*']` glob; existing Nest apps are unaffected.
2. `apps/frontend` is a fully independent workspace package (own `package.json`/`tsconfig.json`/test runner).
3. Admin panel lives inside `apps/frontend` as a protected route group, not a separate app.
4. Frontend gets its own Dockerfile + compose service; a single internal API base URL is used server-to-server (`04-frontend-architecture.md` §3/§10 — see revision note above).

---

**Next:** `02-content-model.md` — full data model for the new content modules, including the two open decisions it must close (Media association pattern, Site Settings table shape).
