# 03 — Backend build order

> Consumes `02-content-model.md` directly. Independent of `01-monorepo-and-infra.md` (backend module work doesn't care how/whether the frontend workspace is wired) — can proceed in parallel with finishing `01`. Each module follows the DDD layering from `00-audit.md` §2 (domain → application → infrastructure → presentation) without modification.
>
> This is a **strict linear order**, not a menu of parallel options — there's one developer building this, and jumping between modules costs more in context-switching than any theoretical parallelism saves.

## 0. Foundation — before any new module

Not a module; shared groundwork every module below depends on.

1. **Schema foundation** — new `apps/backend/src/common/drizzle/schema/shared.schema.ts` (`localeEnum`, `contentStatusEnum` from `02-content-model.md` §0), added to `common/drizzle/schema/index.ts`.
2. **File module extension** — add `position`/`isCover` columns to `file.schema.ts` (§1 of the content model). No new module; existing `file` module code (adapter, repository, controller) is otherwise untouched at this stage — mappers picking `isCover`/ordering by `position` are added when the first module that needs them (Hero) is built, not speculatively now.
3. **All new `Subjects` enum values, added once, in this migration's commit** — `HERO, ABOUT, SITE_SETTING, TECHNOLOGY, NAVIGATION, CASE, POST, CONTACT, COMMENT` added to **both** `apps/backend/src/enums/subjects.enum.ts` and the duplicate `pgEnum` in `libs/database/users.schema.ts` in one pass, not module-by-module. Doing it per-module (the original plan for this doc) means repeatedly reopening and diffing the same two files nine times; batching it here removes that friction and there's no cost to defining a `Subjects` value before its module exists — it's just an unused enum member until then, same as any other enum extended ahead of use.
4. **Migration:** `drizzle/migrations/0001_content_foundations.sql` — generated once for all three of the above together.

Everything after this point gets **its own migration**, generated per module as it's built (`000N_<module>.sql`), not batched into one giant migration — keeps the migration history reviewable and rollback-able one module at a time, same granularity the eventual git history should follow.

## 1. Build order and dependency edges

```
0. shared schema + file columns + Subjects enum
│
├─ 1. hero        (singleton — no deps beyond file)
├─ 2. about       (singleton — no deps beyond file)
├─ 3. site-setting(singleton — no deps beyond file)
├─ 4. technology  (standalone collection — no deps; unlocks case_technology)
├─ 5. navigation  (standalone collection — no deps)
│
├─ 6. case        (depends on: technology [case_technology join], file)
├─ 7. post        (depends on: user [authorUserId], file)
│
├─ 8. contact     (standalone collection — no deps; deliberately deferred, see below)
└─ 9. comment     (depends on: post, captcha [COMMENT_SUBMIT context extension])
```

Rationale for this exact order:
- **Hero → About → Site Settings first**: the simplest possible instance of the singleton + translation-table + file-association pattern. If the translation-table aggregate shape is awkward in practice, that surfaces here — on a few dozen lines of code — not three modules and a publishing workflow later.
- **Technology before Navigation, both before Case/Post**: Technology is a real dependency of Case (`case_technology`), so it has to come first regardless; Navigation adds nothing new architecturally (same collection + translation shape, plus a self-referencing `parentId`) but finishes validating the pattern on a plain collection before Case/Post add publishing workflow and SEO fields on top of it.
- **Case and Post are pulled forward, ahead of Contact**: they carry roughly 80% of this project's actual architectural risk (per-locale slugs, publish/unpublish, SEO fallback, gallery ordering, cross-module joins). Reaching them early answers the question that actually matters — does the chosen architecture hold up under the heaviest content type — while it's still cheap to adjust anything that doesn't.
- **Contact is deliberately pushed late**, right before Comment, not because it depends on anything (it doesn't — see the diagram) but because it's trivial and independent enough to slot in at literally any point without disrupting the sequence; there's no value in front-loading a module that's a single evening's work regardless of when it happens.
- **Comment is last**: the only module depending on another *new* module (Post) plus a change to an *existing* one (Captcha), and comments/moderation/spam-handling are consistently more involved than they look — nothing else should be gated on it.

## 2. Module template (follow top-to-bottom for every module below)

1. Drizzle schema in `apps/backend/src/common/drizzle/schema/<module>.schema.ts`, added to the `index.ts` barrel.
2. Domain entity (flat, ORM-agnostic, `translations: Record<'ru'|'en', X>` where applicable) + abstract repository port under `domain/`.
3. CQRS commands/queries/handlers under `application/` (public read queries + admin write commands, per the matrix in `02-content-model.md` §10) — wiring `@Policy(...)` against the `Subjects` value already defined in Foundation (§0.3), nothing new to add to the enum here.
4. Drizzle repository implementation under `infrastructure/repositories/drizzle/`.
5. Controllers/DTOs/mappers under `presentation/` — public controller with no guard, admin controller with `@UseGuards(JwtAuthGuard, PoliciesGuard)` + `@Policy(...)` per route (reference: `apps/backend/src/modules/users/presentation/controllers/user-role.controller.ts`).
5a. **`role_permission` seed entries for every `@Policy(...)` added in step 5**, in `apps/backend/src/modules/migration/configs/roles.config.ts`'s `ADMIN` role — **in the same commit as step 5, not after.** `@Policy(...)` only checks an ability against whatever CASL actually built for the current role; that ability comes exclusively from these seed rows, not from the enum value existing. Skipping this step is invisible until someone actually calls the admin endpoint with a real token — every Phase 2 module shipped without it and the gap went undetected for two full phases (see `06-master-roadmap.md` §2.5). Treat this as a required step, not an optional follow-up.
6. Drizzle migration generated (`pnpm drizzle:generate`), reviewed, committed.
7. **Tests** (addressing the `00-audit.md` §8 gap): unit tests for command/query handlers and the domain entity (mirroring existing coverage style, e.g. the notification handler/processor specs as the closest existing example); **at least one integration test** under `test/integration/<module>/*.spec.ts` exercising the real command → repository → test database round trip — `test:integration` is configured but has zero spec files today, so the first module built here is also the first real user of that test tier.

A module isn't "done" until step 7 passes — tests are part of the definition of done, not a follow-up task, precisely because "cover it with tests later" is how `00-audit.md` §8's gap happened in the first place. Note that this test tier would **not** have caught the step 5a gap either — none of the existing integration tests drive a real HTTP request through the CASL guard stack with a real seeded role, they exercise the command/repository layer directly. Catching a missing `role_permission` row requires either an integration test that goes through the actual guarded route, or (as actually happened) exercising the admin UI against the real backend.

## 3. Module-by-module notes

### 1. `hero`
- Seed: one row inserted via a migration-time seed (same mechanism as `roles-seed.service.ts`), matching the "no create endpoint" singleton pattern from `02-content-model.md` §3.
- Endpoints: `GET /hero` (public), `PATCH /admin/hero` (`Subjects.HERO`, `Actions.UPDATE`).
- Photo replace flow: updating the photo deletes the old `file` row synchronously in the same handler (no event needed — singleton, 1:1 replace, not a bulk delete).
- First module built → also where the file mapper's `isCover`/`position` reading logic is actually implemented (used by every module after it).

### 2. `about`
- Same singleton shape as Hero. Introduces disambiguating by `file.type` (`IMAGE` for photo vs. `DOCUMENT` for an optional résumé) in the mapper — the second and last place this specific disambiguation is needed until Media handling is revisited.

### 3. `site-setting`
- Same singleton shape. `Subjects.SITE_SETTING`, `Actions.UPDATE` only. Favicon replace follows the same synchronous-cleanup pattern as Hero's photo.

### 4. `technology`
- First real collection module (`Actions.CREATE`/`DELETE` in addition to `READ`/`UPDATE`) — adds the `iconSlug` vs. uploaded-`file` fallback branch in the mapper, plus `position`-based ordering (a drag-and-drop target for `05-admin-panel.md`).
- Built now specifically to unblock `case_technology` — deleting a technology that's still referenced by a case is a real constraint decision made here: recommend `onDelete: 'restrict'` on `case_technology.technologyId` (surface a clear admin-facing error — "remove this technology from N cases first" — rather than silently cascading it out of case listings).

### 5. `navigation`
- Collection + translation table + self-referencing `parentId`. Exercises the translation-table pattern on a plain (non-singleton) collection — Case/Post below repeat this exact shape with more fields.

### 6. `case`
- Depends on `technology` (`case_technology` join table) — must be built after it.
- Introduces `contentStatusEnum` (draft/published/archived) and per-locale unique slugs — first real use of the publishing workflow.
- **Delete-triggered file cleanup: done directly in the delete handler, not via `EventBus`.** `02-content-model.md` §1's original mitigation proposed a `CaseDeletedEvent` consumed by a file-module handler; on reflection that's more indirection than the problem needs. `EventBus` fan-out earns its keep when multiple independent listeners react to one event (as `UserCreatedEvent` genuinely does today — notification *and* mail both react). File cleanup on delete has exactly one listener, ever. **Built as: `CaseDeleteHandler` injects `FileRepository` directly** (not a dedicated `FileAssociationCleanerPort` — `FileModule` is `@Global()`, so `FileRepository` is already available anywhere without an extra abstraction layer) and calls `deleteByExternalId` after the case's own delete:
  ```ts
  async execute({ id }: CaseDeleteCommand): Promise<void> {
    await this.caseRepository.delete(id);
    await this.fileRepository.deleteByExternalId(id);
  }
  ```
  Not wrapped in a shared transaction across both repositories (a deliberate, documented simplification — see `06-master-roadmap.md` §2.5's file-upload finding); worst case on a crash mid-delete is an orphaned file row, the same "latent-cleanup, not correctness" risk `02-content-model.md` §1 already accepted. Same fix applies to `post` (§7) below.

### 7. `post`
- Depends on the existing `users` module (`authorUserId` FK) and `file`.
- Same `contentStatusEnum`/slug/SEO shape as Case, ordered by `publishedAt desc` instead of manual `position`. **Revised after Phase 4:** unlike Case, Post is not bilingual — no `post_translation` table; `locale`/`title`/`slug`/`excerpt`/`body`/`seoTitle`/`seoDescription` live directly on `post`, with `locale` fixed at creation (`02-content-model.md` §7).
- Same delete-triggered file cleanup as Case, via `FileRepository.deleteByExternalId` called directly from `PostDeleteHandler` — **built without the `FileAssociationCleanerPort` abstraction** this doc originally proposed. `FileModule` turned out to be `@Global()` in this app, so `FileRepository` is already injectable anywhere without an extra port; the port pattern earns its keep across a real process boundary (like the auth-service gRPC split), not as indirection within one Nest app.

### 8. `contact`
- Full CRUD (`Subjects.CONTACT`), no translation table (per content model §4) — the simplest module in this entire list. Built here, not earlier, purely to keep the sequence focused on Case/Post while they're still fresh in context; nothing about it depends on anything built before it, so if it's more convenient to slot it in anywhere earlier (e.g. as a break between Technology and Case), that's a free rearrangement with zero risk.

### 9. `comment`
- Depends on `post` (FK) and on extending the existing `captcha` module with one new `CaptchaChallengeContext.COMMENT_SUBMIT` enum value (`02-content-model.md` §7 anti-spam section) — the only module here that modifies an *existing* module rather than only adding a new one.
- Public submit endpoint (`POST /posts/:slug/comments`) requires a `PASSED` captcha challenge id in the payload, verified via the existing `VerifyCaptchaChallengeCommand` path, plus the honeypot field validated (and discarded) at the DTO layer.
- `Subjects.COMMENT` — admin gets `READ`/`UPDATE` (moderation: approve/reject by flipping `status`) and `DELETE`; there is no admin `CREATE` (comments only originate from the public endpoint).
- **Addendum, found in Phase 4 (not in original planning): the captcha subsystem needs bootstrapped data before `COMMENT_SUBMIT` (or any context) can produce a single challenge.** Extending the enum value is necessary but not sufficient — challenge creation looks up a template by code (default `svg-text-ru-v1`), which must exist with an *active* config and a non-empty Redis asset pool, or every request 404s with `captcha.template.notFound` / 503s with `captcha.pool.empty`. Fixed with a `CaptchaTemplateSeedService` (seeds the default template + config on first boot, same pattern as Hero/About/SiteSetting) and a `CaptchaPoolReplenishmentService` (`@Cron`, tops up any pool below a watermark — nothing else in the original design kept the pool from draining to zero over time as real challenges get consumed).

## 3a. Addendum: view-count increment endpoints (added in Phase 3, missing from the original module notes above)

Neither this doc's Case/Post sections nor `02-content-model.md` §10's CASL matrix ever specified an actual endpoint for incrementing `viewCount` — §9 of `02` describes the Redis-dedup *mechanism*, but no `POST /cases/:slug/view` / `POST /posts/:slug/view` route was ever written down. The DTOs carried `viewCount` correctly from the start; nothing ever incremented it until this was caught while building the Phase 3 frontend's view beacon (`04` §7 assumes the endpoint exists). Added: a shared `ViewTrackingModule` (`common/view-tracking/`) providing Redis `SET NX`-based dedup (30 min window, keyed by a hash of visitor IP+UA — reusing the same hashing approach as Comment's `ipAddressHash`), plus one public, unguarded `POST .../view` route per entity (Case, Post) following the existing repository/command/handler layering. No schema change — `viewCount` already existed.

## 4. What this doc does not cover

Frontend consumption of these endpoints (`04-frontend-architecture.md`), admin CRUD screens (`05-admin-panel.md`), and the overall phase/milestone rollup (`06-master-roadmap.md`) are all out of scope here — this is purely the backend module construction order and its internal dependencies.

---

**Next:** `04-frontend-architecture.md` (soft dependency on this doc's endpoint/DTO shapes, hard dependency on `01`'s workspace decisions) and `01-monorepo-and-infra.md` can each proceed now — `01` isn't blocked by this doc and may already be finished in parallel.
