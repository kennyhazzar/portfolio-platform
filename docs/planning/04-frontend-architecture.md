# 04 — Frontend architecture

> Soft dependency on `03-backend-build-order.md` (needs the DTO/endpoint shapes it defines, not the modules actually built yet). Hard dependency on `01-monorepo-and-infra.md` (workspace setup, admin-in-same-app decision). Resolves the auth-flow detail `01` §3 explicitly deferred here, and revises one assumption from `01` §4 (see §10).

## 1. Route structure

```
apps/frontend/
  middleware.ts                     # locale redirect + admin auth gate
  app/
    [locale]/                       # 'ru' | 'en' — public site only
      layout.tsx
      page.tsx                      # home: Hero + Contacts + featured Cases + latest Posts + Technologies + About excerpt
      about/page.tsx
      cases/page.tsx
      cases/[slug]/page.tsx
      posts/page.tsx
      posts/[slug]/page.tsx
    admin/                          # NOT locale-prefixed — operator tool, not bilingual content
      layout.tsx                    # root layout for the whole /admin tree (own <html>/<body> — see note below)
      login/page.tsx                # only admin route outside the auth gate
      (protected)/                  # route group: everything the middleware auth-gates
        layout.tsx                  # fetches the current user, renders AdminSidebar + logout
        page.tsx                    # dashboard landing
        hero/page.tsx
        about/page.tsx
        site-settings/page.tsx
        technology/page.tsx
        navigation/page.tsx
        cases/page.tsx  cases/new/page.tsx  cases/[id]/page.tsx
        posts/page.tsx  posts/new/page.tsx  posts/[id]/page.tsx
        contacts/page.tsx
        comments/page.tsx            # moderation queue, ?status= filter
    api/
      auth/{login,refresh,logout}/route.ts   # BFF proxy to backend (§4)
      view/route.ts                          # view-count proxy (§7)
      comments/route.ts                       # comment submit proxy (§8)
      captcha/route.ts                        # challenge creation proxy (§8)
      captcha/image/[id]/route.ts             # challenge image streaming proxy (§8)
      preview/route.ts                        # Draft Mode: admin-auth check + enable + redirect (05 §3)
      preview/disable/route.ts                # Draft Mode: exit preview (05 §3)
      files/[id]/route.ts                     # PUBLIC file streaming proxy for FileUploadField/MediaGalleryField images (05 §1)
    sitemap.ts                        # Next file convention — enumerates both locales
    robots.ts
```

Admin sits outside `[locale]` because it's a single operator's tool, not localized content — its own UI chrome can be one fixed language regardless of how many locales the *site content* supports, matching the `01` §3 decision that it's a route group in the same app rather than a separate one.

**As built, this deviates from the plan in two small ways:**
- The single `captcha/[...path]/route.ts` catch-all envisioned here became **two** concrete routes — `captcha/route.ts` (POST, creates a challenge) and `captcha/image/[id]/route.ts` (GET, streams the challenge image). A catch-all adds routing-logic branching for no real benefit when there are only ever two operations; two explicit routes are simpler to read and type.
- Creation flows (`cases/new`, `posts/new`) are their own routes rather than overloading `[id]` with a sentinel value — Next.js resolves the literal `new` segment ahead of the dynamic `[id]` segment without conflict, and it keeps the "create" and "edit" server components from needing to branch internally on whether an id was provided.
- `admin/layout.tsx` and `admin/(protected)/layout.tsx` are two separate layouts, not the one `layout.tsx` this tree originally showed. The reason: the login page and the protected pages need different chrome (login has no sidebar/user-menu at all), but both need to share one `<html>`/`<body>` root — Next.js requires exactly one root layout per reachable route, and a route group (`(protected)`, invisible in the URL) is the mechanism for splitting chrome without splitting the root.
- `api/preview/route.ts` + `api/preview/disable/route.ts` were added post-Phase-4 for Draft Mode preview (`05` §3, built in Phase 4.6 of `06-master-roadmap.md`) — not in this tree's original draft, since that section was designed but explicitly deferred at the time `04` was first written.
- `api/files/[id]/route.ts` was added post-Phase-4 alongside `FileUploadField`/`MediaGalleryField` (`05` §1, built in Phase 4.7) — the same streaming-proxy shape as `captcha/image/[id]/route.ts`, needed so admin-uploaded images can be shown via a plain `<img>` tag without the browser calling the backend directly.

## 2. Locale strategy

Path-based: `/ru/...` and `/en/...`, matching the per-locale unique slugs already decided in `02-content-model.md` (`case_translation` has `uniqueIndex(locale, slug)` — RU and EN versions of the same case can have entirely different slugs, which path-based locale segments handle naturally). Post is not bilingual (`02-content-model.md` §7, revised after Phase 4) — a post exists under exactly one locale prefix, the one it was written in; there's no sibling-locale version to route to.

`middleware.ts` redirects `/` (and any locale-less path) to `/{detectedLocale}` based on `Accept-Language`, then a cookie remembers the choice for subsequent visits — standard Next.js i18n middleware pattern, no new mechanism invented.

**hreflang / cross-locale linking (Case only):** since RU and EN slugs for the same case can differ, the frontend can't derive the sibling-locale URL from the slug alone. The public DTO for a single Case (mapper output, no schema change) includes the sibling slug, e.g.:
```json
{ "locale": "ru", "slug": "moi-proekt", "alternates": { "en": "my-project" }, ... }
```
`generateMetadata` uses this for `alternates.languages` (hreflang tags) and for the locale-switcher UI control. `PostDto` carried the same `alternates` field briefly but it was removed once Post stopped being bilingual — a post has no sibling locale to link to.

## 3. Data-fetching & the API boundary

**Decision: the browser never talks to the backend directly. Every backend call is server-side** — Server Components, Server Actions, or the thin Route Handlers under `app/api/*` — using a single `INTERNAL_API_BASE_URL` (container-to-container in Docker, `http://localhost:3000` in dev).

This revises `01-monorepo-and-infra.md` §4, which reserved a `NEXT_PUBLIC_API_BASE_URL` for direct browser calls. Once the design fell out (view-count beacon, comment submission, and the captcha challenge flow — the three things that genuinely originate in the browser — are each proxied through a small Route Handler, §7/§8), there was no remaining caller that needed the backend's address exposed to client JS at all. Concretely this means:
- No CORS configuration is needed on the backend for the frontend's origin — the backend never receives a browser-origin request in the first place, only server-to-server calls from Next's own runtime.
- The backend doesn't need to be reachable from the public internet at all if the deployment wants to keep it fully internal to the Docker network, with Next as the only public-facing surface.
- `NEXT_PUBLIC_API_BASE_URL` is dropped from the env contract in `01` §4; only `INTERNAL_API_BASE_URL` remains.

**Typed client:** generate a typed fetch client from the backend's existing Swagger/OpenAPI spec (`config.yaml`'s `swagger` section is already enabled) via `openapi-typescript`, checked in under `apps/frontend/src/lib/api/generated`, regenerated with a `generate:api` script hitting the backend's OpenAPI JSON endpoint. Avoids hand-duplicating DTOs on the frontend side.

## 4. Admin auth flow (resolves the item `01` §3 deferred)

Cookies are `httpOnly`, so client JS can't read them, but that's irrelevant here since nothing in this design runs backend calls from the browser. The remaining question `01` left open was **which domain the auth cookies live on** — and the answer follows directly from §3's "no direct browser-to-backend calls" decision: cookies must be scoped to the **frontend's own origin**, not re-used from the backend, because the browser only ever talks to the frontend.

The backend already exposes exactly what's needed here, confirmed in `apps/backend/src/modules/users/presentation/controllers/auth.controller.ts`: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, and `GET /auth/me` (`@UseGuards(JwtAuthGuard)`, returns the current user incl. role). No new backend endpoints needed for this flow.

- `app/api/auth/login/route.ts` — Route Handler, receives credentials from the admin login form, forwards them server-to-server to `POST /auth/login` via `INTERNAL_API_BASE_URL`, then re-issues `accessToken`/`refreshToken` as its own `httpOnly` cookies on the frontend's response (same flags as `config.production.yaml.example`'s `auth.cookies` block: `secure`, `sameSite: strict`, matching `maxAge`).
- `app/api/auth/refresh/route.ts` — same proxy shape, calling `POST /auth/refresh`. See the race-condition note below — this route is the one place that must be single-flight-guarded.
- `app/api/auth/logout/route.ts` — clears the frontend-scoped cookies and calls `POST /auth/logout`.
- `middleware.ts` gates `/admin/*` (except `/admin/login`) by calling `GET /auth/me` server-to-server, forwarding the `accessToken` cookie as `Authorization: Bearer <token>` — **not** local JWT verification. This was the original design (`jose` + a secret shared between Next and the backend), reconsidered: sharing the signing secret across a third process is an ongoing coupling cost (any future algorithm change or key rotation has to stay synchronized across two codebases), and for a single-operator admin panel the extra internal round-trip `GET /auth/me` costs — Next and the backend sit on the same Docker network, this is a sub-millisecond hop, not a real latency concern at this project's scale. Trading a small, constant latency cost for "the backend stays the one and only source of truth on session validity" is the better trade here. If `/auth/me` ever returns 401, middleware attempts the refresh route before redirecting to `/admin/login`.
- Every admin Server Component/Action reads the `accessToken` cookie via `next/headers` `cookies()` and forwards it as `Authorization: Bearer <token>` on its own server-to-server call to the backend — explicit and unambiguous, not relying on cookie-forwarding semantics between two separate server processes.

**Refresh race condition — a real, confirmed risk, not a theoretical one.** `apps/auth-service/src/modules/auth/application/handlers/refresh-tokens.handler.ts` implements strict single-use refresh-token rotation: each successful refresh revokes the token just used and issues a new one; presenting an already-revoked refresh token doesn't just fail, it triggers `revokeAllForUser` (theft-detection, treated as a compromised-token signal) — logging the user out of every session. Several near-simultaneous requests hitting `/admin/*` around the moment the access token expires (multiple open tabs, or several parallel data requests from one page load) could each independently trigger `app/api/auth/refresh/route.ts`; only the first succeeds, and the rest present a token that's now revoked, forcibly logging the admin out mid-session — a real bug, not an edge case worth ignoring.

**Fix: an in-memory single-flight guard around the refresh call**, keyed by the refresh token value — concurrent callers within the same tick await one shared in-flight `POST /auth/refresh` call instead of each issuing their own:
```ts
const inFlightRefresh = new Map<string, Promise<RefreshResult>>();

function refreshOnce(refreshToken: string): Promise<RefreshResult> {
  const existing = inFlightRefresh.get(refreshToken);
  if (existing) return existing;
  const promise = doRefresh(refreshToken).finally(() => inFlightRefresh.delete(refreshToken));
  inFlightRefresh.set(refreshToken, promise);
  return promise;
}
```
This relies on the frontend running as a **single long-lived Node process** — true for this project's actual deployment (`01-monorepo-and-infra.md`'s self-hosted Docker Compose service, `output: 'standalone'`, one container), where in-memory state naturally persists across concurrent requests within that one process. It would **not** be reliable on a horizontally-scaled or edge-distributed deployment (e.g. Vercel's multi-region edge network, where each instance has isolated memory) — if the frontend is ever scaled to multiple instances, this lock must move to Redis (`SET NX` with a short TTL, the same primitive already used for the Analytics view-count dedup in `02-content-model.md` §9) instead of an in-process `Map`. Not needed now; flagged so it isn't silently forgotten if the deployment topology changes.

**CSRF note:** the backend's `auth.csrf` protection (`config.production.yaml.example`) is designed for browsers calling it directly with auto-attached cookies — that path no longer exists in this design (calls to the backend are server-to-server with an explicit Bearer token). The CSRF-relevant boundary moves to the Next app's own Route Handlers, which *are* called by the browser using frontend-domain cookies: Next's Server Actions already carry a built-in same-origin check, and the handwritten Route Handlers under `app/api/*` should verify the `Origin`/`Sec-Fetch-Site` header matches the frontend's own origin before acting — a lightweight equivalent, not a reimplementation of the backend's CSRF-token mechanism.

## 5. Caching & revalidation

Public pages are Server Components using `fetch(url, { next: { tags: ['post:'+slug], revalidate: 3600 } })` — time-based revalidation as a safety net, but the real freshness mechanism is on-demand: since admin lives in the same Next app (`01` §3), a Post/Case publish or update Server Action calls `revalidateTag('post:'+slug)` (and the list tag, e.g. `'posts'`) immediately after a successful backend write — the public page reflects an edit the moment it's published, without waiting for the TTL. This only works cleanly *because* admin and public site share one Next.js cache — a concrete point in favor of the `01` decision to keep them in one app rather than two.

## 6. SEO, sitemap, robots

- `generateMetadata` per route reads the entity's own `seoTitle`/`seoDescription` (`02-content-model.md` §6/§7), falling back to `site_setting_translation.defaultSeoTitle`/`defaultSeoDescription` (§2's addition) when blank.
- `alternates.languages` built from the `alternates` field on the DTO (§2 above).
- Open Graph image: the entity's `isCover` file (`02-content-model.md` §1), resolved to a public URL via the existing file module.
- `app/sitemap.ts` enumerates static pages × 2 locales plus every published Post/Case × its own locale-specific slug (fetched from the backend's public list endpoints at generation time).
- `app/robots.ts` disallows `/admin` and `/api`, references the sitemap.

## 7. View counting (ties to `02-content-model.md` §9's Redis-dedup counter)

**Not incremented as a side effect of the page's server-side render.** Next's `<Link>` prefetching renders a route's Server Components ahead of an actual visit (on hover/viewport-enter), so any increment embedded in the page's own data-fetching function would fire on prefetch too, silently inflating counts from users who never actually opened the page.

Instead: a tiny Client Component (`<ViewBeacon entityType="post" entityId={id} />`) mounted on the page, firing once from a `useEffect` after real client-side mount/hydration (which prefetching does not trigger) — `useEffect` posts to `app/api/view/route.ts`, which proxies to the backend's public increment endpoint. Minimal JS footprint; the rest of the page stays Server Components.

## 8. Comments & captcha (frontend side of `02-content-model.md` §7 / `03` §9's anti-spam design)

Comment form is a Client Component (it needs interactivity: fetch a captcha challenge, render its image, collect the answer). All three calls it makes go through `app/api/captcha/route.ts` (create challenge), `app/api/captcha/image/[id]/route.ts` (stream the image), and `app/api/comments/route.ts` (submit) — proxies to the backend, keeping the "browser never calls backend directly" rule from §3 intact even for this one genuinely interactive flow. The honeypot field is a plain hidden input in the same form, submitted alongside the real fields, validated (and discarded) at the backend DTO layer per `02-content-model.md` §7 — no frontend-side logic needed for it beyond rendering it hidden.

Both the view-count beacon (§7) and the comment/captcha proxies forward the real visitor's IP/UA (`X-Forwarded-For`, `User-Agent` headers) on their server-to-server call to the backend — without this, the backend's dedup hash would be computed against the Next.js server's own address for every visitor, not the actual visitor, defeating the point of both the view-count dedup and the comment `ipAddressHash`.

## 9. Styling / design system

**Confirmed: TailwindCSS + shadcn/ui across the entire frontend — public site and admin panel alike, not split per section.** This was raised explicitly as worth double-checking, since MUI's ready-made table/form/DataGrid components are a genuine shortcut for admin CRUD screens — but running two component libraries in one `apps/frontend` (Tailwind/shadcn for the public site, MUI for `/admin`) means two styling engines, two theming systems, and no shared primitives between the two halves of the same app, for a benefit that's mostly upfront convenience on forms/tables that `05-admin-panel.md` can build once with shadcn's `Table`/`Form` primitives anyway. One library, one design language, consistent with the rest of the stack's "one clear way to do things" character (DDD layering, CQRS, the translation-table convention) rather than an exception carved out for the admin half.

Components added incrementally as pages need them (not scaffolded wholesale upfront). A small shared token set (spacing/type scale) backs the brief's "strict style, lots of whitespace, calm palette, minimal animation" — exact values are an implementation detail for when the UI is actually built, not a planning-stage decision.

**Fonts, decided at implementation time (§13 flagged this as deferred; now settled):** three self-hosted variable fonts — **Unbounded** (`--font-heading`, display/headline moments only), **Onest** (`--font-sans`, body/UI default), **JetBrains Mono** (`--font-mono`, labels/dates/eyebrows/code, and reused for the admin UI's own chrome). All three downloaded once from their source repos and committed under `apps/frontend/src/fonts/*.ttf`, loaded via `next/font/local` — deliberately not `next/font/google`, which still makes a network request to Google at build time even though it self-hosts the files it fetches; the requirement here was zero external network dependency at build time too, not just at runtime. Each is a single variable-weight file covering the full weight range and both Latin+Cyrillic, so one file per family is enough. The admin shell (`05` §5) intentionally omits the display font — it's reserved for the public site's headline moments, admin chrome uses body+mono only.

## 10. Internal structure: Feature-Sliced Design

App Router (§1) fixes the *routing* surface (`app/**`) but says nothing about where non-route code (components, API-client calls, hooks, types) lives — that's a separate, real decision. `apps/frontend/src` uses Feature-Sliced Design layers, imported only downward (a layer may import from layers below it, never above or sideways):

```
apps/frontend/src/
  app/          # Next.js App Router itself (routing, layouts, pages) — thin, delegates to widgets/features
  widgets/      # composed page sections: SiteHeader, CaseGrid, PostList, AdminSidebar, CommentModerationQueue
  features/     # one user-facing action each: submit-comment, publish-post, upload-media, locale-switcher
  entities/     # domain-shaped UI + client-side types per content type: post/, case/, hero/, contact/, technology/
  shared/       # design-system primitives (shadcn components, Tailwind config), the generated API client (§3), utils
```

- Route files under `app/[locale]/posts/[slug]/page.tsx` etc. stay thin — they compose `widgets`/`entities`, they don't contain business logic themselves.
- The generated OpenAPI client (§3) lives in `shared/api`; each `entities/<type>` slice wraps the relevant generated calls with the types/hooks specific to that content type (e.g. `entities/post/api.ts` re-exporting typed `getPost`/`listPosts`).
- `features/submit-comment` owns the comment form, its captcha interaction (§8), and the honeypot field — a self-contained unit rather than logic spread across a shared "forms" folder.
- Admin CRUD screens (`05-admin-panel.md`) are `widgets` (e.g. `widgets/admin/CaseTable`) composed from `entities/case` + `shared/ui`, kept in the same FSD tree as the public site rather than a parallel structure — one set of layer rules for the whole app, admin included.

## 11. State management

**No Redux/Zustand/global client store.** Server Components handle almost everything (public content is fetched server-side, §3); the handful of genuinely interactive bits (`ViewBeacon`, the comment form, admin CRUD forms) each own their local state and don't need to share it across the app. If a later admin screen turns out to need real client-side server-state caching (optimistic updates, background refetch on a busy moderation queue), reach for **TanStack Query** at that point, scoped to that one `feature`/`widget` — not a store adopted upfront on spec. Written down explicitly so this isn't re-litigated once `05-admin-panel.md`'s CRUD screens are actually being built.

## 12. What this doc revises in earlier docs

- `01-monorepo-and-infra.md` §4: drop `NEXT_PUBLIC_API_BASE_URL` from the Docker/env contract — only `INTERNAL_API_BASE_URL` is used, per §3's "no direct browser-to-backend calls" decision.

## 13. What's deferred

- TanStack Query adoption (§11) — only once a concrete screen in `05-admin-panel.md` actually needs it.

Draft Mode preview and the `FileUploadField`/`MediaGalleryField` widgets, both listed here as deferred in earlier revisions of this doc, have since been built (`06-master-roadmap.md` Phases 4.6/4.7).

## 14. Responsive design (added post-Phase-3, not originally planned here)

Neither this doc nor `05-admin-panel.md` called out mobile/responsive behavior as its own concern anywhere — it surfaced as an explicit request after Phase 4 shipped, and the audit found two real (not cosmetic) gaps:

- **Public site header**: the nav (`Cases`/`Blog`/`About`) was `hidden sm:flex` with no mobile equivalent at all — below the `sm` breakpoint (640px) there was no way to navigate the site. Fixed with a client-side hamburger menu (`widgets/mobile-nav.tsx`) shown only below `sm`, overlaying a dropdown of the same links.
- **Admin shell**: `AdminSidebar` was a fixed `w-[220px]` flex sibling of the main content — on a phone this would have squeezed admin content into a sliver next to a panel wider than most phone screens' comfortable reading width. Fixed by making `AdminSidebar` itself responsive: below `lg` it renders as a sticky top bar (logo + hamburger) with a full-width slide-down drawer holding the same nav links; at `lg` and above it renders the original fixed sidebar. `lg` (1024px) rather than `sm` specifically because the admin nav has ten items with long labels ("Настройки сайта" etc.) — a 220px sidebar needs more surrounding width than the public nav's three short links do before it's worth switching to that layout.
- General pass across both halves of the app: list rows with several fixed-pixel-width inline fields (the Technology/Contact/Navigation admin list widgets' inline edit forms) got `flex-wrap` + `min-w-0` + `w-full sm:w-[Npx]` so fields stack full-width on narrow screens instead of being squeezed into odd fixed-width columns; markdown-rendered images gained `max-w-full`; markdown tables (enabled via `remark-gfm` but never given a wrapper) gained an `overflow-x-auto` container.

Verified via code-level audit (Tailwind breakpoint classes, container/flex layout logic) plus dev-server smoke tests confirming both the mobile and desktop markup render with the expected classes — **not** a visual/screenshot pass, since no browser-automation tooling was available in-session. A manual DevTools device-toolbar spot-check is still worth doing.

---

**Next:** `05-admin-panel.md` — the CRUD screens themselves, now that where they live (`01`) and how they authenticate (§4 above) are both settled.
