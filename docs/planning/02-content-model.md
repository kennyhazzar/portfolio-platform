# 02 — Content model

> The hard gate for `03-backend-build-order.md`, `04-frontend-architecture.md`, `05-admin-panel.md` — nothing downstream starts before this is settled. Builds on the DDD/CQRS/Drizzle conventions from `00-audit.md` §2 and the localization approach from the approved plan. Closes two decisions flagged open: the Media association pattern and the Site Settings table shape.

## 0. Shared conventions (new file `apps/backend/src/common/drizzle/schema/shared.schema.ts`)

```ts
export const localeEnum = pgEnum('Locale', ['ru', 'en']);
export const contentStatusEnum = pgEnum('ContentStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
```

Added to the `common/drizzle/schema/index.ts` barrel alongside the per-module schema files, matching the existing pattern.

Naming, standardized going forward (existing tables are inconsistent — e.g. `file-version` is hyphenated while `access_log`/`system_setting` are snake_case; new tables use snake_case singular consistently): `post`, `post_translation`, `case`, `case_translation`, etc. Index prefixes: `IDX_` for lookup indexes, `U_` for unique constraints — matching the majority convention already in `file.schema.ts`/`admin.schema.ts`.

Every translatable entity gets a `<entity>_translation` child table: one row per locale, FK back to the parent with `onDelete: 'cascade'`, `uniqueIndex` on `(parentId, locale)`. This mirrors the existing `file`/`file-version` parent/child shape and keeps domain entities flat (a `translations: Record<'ru'|'en', X>` field on an otherwise ORM-agnostic class, same shape as today's `File`/`FileVersion`).

## 1. Decision: Media association pattern

**Reuse the existing `file` table's polymorphic association (`module` + `externalId`) as-is for every new content type — no join tables, no per-entity FK columns.**

Why this works without schema changes to the association mechanism itself: `file.externalId` (uuid) already points at "whatever owns this file" without a type discriminator column, and that's fine because UUIDs are globally unique — filtering `WHERE externalId = :caseId` never collides with a different entity's id. `file.module` (`FileFrom: 'USER' | 'PUBLIC'`) already distinguishes private user uploads from publicly-displayed files, which is exactly the right flag for site content images: they're always `module: 'PUBLIC'`. `file.type` (`FileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER'`) already lets a mapper pick "the image" vs. "the document" when one entity has more than one attached file (e.g. About's profile photo vs. a downloadable resume).

**One small, additive schema change is needed** to `file.schema.ts` to support ordered galleries (Cases will want more than one screenshot) and a defined "cover" image (Posts/Cases card thumbnails):

```ts
// added to the file table
position: integer('position').notNull().default(0),
isCover: boolean('isCover').notNull().default(false),
```

Both nullable-safe defaults, backward compatible with existing rows. Usage convention: `isCover: true` marks the thumbnail/hero image for an entity; `position` orders any remaining gallery images. No new table, no new module — Media *is* the existing `file` module, unchanged except for these two columns.

**Trade-off, accepted deliberately:** this association has no DB-level referential integrity — deleting a `case`/`post`/`hero`/`about`/`site_setting` row does not cascade to its `file` rows, and nothing stops a file from pointing at a nonexistent `externalId`. For a single-operator portfolio site this is an acceptable trade-off in exchange for not introducing per-entity FK columns or an `ownerType`/`ownerId` polymorphic pair. It is mitigated at the application layer instead of the schema layer: every `Delete*Command` handler for an entity that owns files also deletes its associated `file` rows (`WHERE externalId = :id`) via a direct, synchronous call — not an `EventBus` fan-out, since file cleanup on delete has exactly one listener, ever, and event-handler execution isn't guaranteed to run in the same transaction as the delete itself. **Built (Phase 4.7) as a direct `FileRepository` injection into `CaseDeleteHandler`/`PostDeleteHandler`**, not the dedicated cross-module port originally sketched here — `FileModule` turned out to already be `@Global()` in this app, so no extra abstraction was needed to make `FileRepository` reachable from another module's handler; the port pattern (as used by `auth-gateway.port.ts`) earns its keep across a real process boundary like the auth-service gRPC split, not within one Nest app. Not wrapped in a shared transaction with the entity's own delete, either — a further simplification, since the failure mode (an orphaned file row on a crash mid-delete) is exactly the "latent-cleanup, not correctness" risk already accepted below. Concrete wiring is in `03-backend-build-order.md` §3 (Case/Post). Orphaned rows from a crash mid-delete are a latent-cleanup problem, not a correctness problem (they're simply unreferenced storage), so no reconciliation job is built for this now.

## 2. Decision: Site Settings table shape

**A new typed, bilingual `site_setting` (+ `site_setting_translation`) pair — the existing `system_setting` key/value table is left untouched and continues to serve non-content operational flags.**

Reasoning: the requested fields (favicon, title, description, footer, copyright) need (a) a real file reference for the favicon — awkward to express in a flat string-value KV table — and (b) RU/EN variants for title/description/footer/copyright, which a KV table would only support via stringly-typed key hacks (`site.title.ru`, `site.title.en`) with no referential integrity and no fit with the translation-table convention used everywhere else. A dedicated pair, following the same singleton pattern as Hero/About (see §3), is consistent instead of a special case.

```ts
export const siteSetting = pgTable('site_setting', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettingTranslation = pgTable('site_setting_translation', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteSettingId: uuid('siteSettingId').notNull().references(() => siteSetting.id, { onDelete: 'cascade' }),
  locale: localeEnum('locale').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  footerText: text('footerText'),
  copyrightText: varchar('copyrightText', { length: 255 }),
  defaultSeoTitle: varchar('defaultSeoTitle', { length: 255 }),
  defaultSeoDescription: varchar('defaultSeoDescription', { length: 500 }),
}, (t) => [uniqueIndex('U_site_setting_translation_locale').on(t.siteSettingId, t.locale)]);
```

`defaultSeoTitle`/`defaultSeoDescription` are the fallback the frontend's Metadata API uses whenever a Post/Case's own `seoTitle`/`seoDescription` (§6/§7) is left blank — avoids forcing every single entry to fill in SEO fields just to avoid a blank `<title>`/meta description.

Favicon: a `file` row with `externalId = siteSetting.id`, `module: 'PUBLIC'`, `isCover: true` — same association as everything else, no dedicated `faviconFileId` column.

## 3. Singleton content: Hero, About

Both are "one row, edited in place" — no create/delete endpoint is ever exposed; each is seeded once (via a migration seed, same mechanism as `roles-seed.service.ts`) and only `Update*Command` exists. This avoids needing a DB-level singleton constraint. (A `CHECK`/fixed-`id` constraint was considered and rejected — for a single-operator site, "no create endpoint exists" is enforcement enough, and it keeps the table shape identical to every other entity rather than a special case.)

**`hero`** — `id`, `ctaUrl varchar` (locale-agnostic link target), `createdAt/updatedAt`.
**`hero_translation`** — `id`, `heroId` FK, `locale`, `name varchar(255)`, `headline varchar(500)` (short tagline), `description text`, `ctaLabel varchar(255)`; unique `(heroId, locale)`.
Photo: `file` with `externalId = hero.id`, `module: 'PUBLIC'`, `isCover: true`, `type: 'IMAGE'`.

**`about`** — `id`, `createdAt/updatedAt`.
**`about_translation`** — `id`, `aboutId` FK, `locale`, `bio text` (markdown). Profile photo and an optional downloadable résumé both attach via `file.externalId = about.id` (`module: 'PUBLIC'`), disambiguated by `file.type` (`IMAGE` vs `DOCUMENT`) — no extra columns needed.

## 4. Contacts

**No translation table** — a contact's platform is a fixed enum the frontend already has to render an icon/label for via its own static UI-string dictionary (this is chrome text, not admin-authored content, same reasoning as Comments in §7 not needing one).

```ts
export const contactPlatformEnum = pgEnum('ContactPlatform', ['GITHUB', 'TELEGRAM', 'HABR_CAREER', 'EMAIL', 'LINKEDIN', 'OTHER']);

export const contact = pgTable('contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: contactPlatformEnum('platform').notNull(),
  value: varchar('value', { length: 255 }).notNull(), // URL, handle, or email address
  position: integer('position').notNull().default(0),
  isVisible: boolean('isVisible').notNull().default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});
```

Each contact is its own row/entity per the brief — `platform` is not unique (in case of, e.g., two GitHub-style links later), ordering/visibility drive the public display.

## 5. Technologies

Tech names are proper nouns ("TypeScript", "NestJS") — **no translation table**.

```ts
export const technologyCategoryEnum = pgEnum('TechnologyCategory', ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'INFRA', 'TOOL', 'OTHER']);

export const technology = pgTable('technology', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  category: technologyCategoryEnum('category').notNull().default('OTHER'),
  iconSlug: varchar('iconSlug', { length: 100 }), // e.g. a simple-icons slug — avoids a file upload per logo
  position: integer('position').notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});
```

`iconSlug` is the default path (zero admin friction, e.g. a well-known icon-set key resolved client-side); falls back to an uploaded `file` (via the same association, `type: 'IMAGE'`) if `iconSlug` is null, for anything not covered by a standard icon set.

## 6. Cases

```ts
export const caseEntity = pgTable('case', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: contentStatusEnum('status').notNull().default('DRAFT'),
  publishedAt: timestamp('publishedAt', { withTimezone: true }),
  position: integer('position').notNull().default(0), // manual "featured" ordering
  repoUrl: varchar('repoUrl', { length: 500 }),
  liveUrl: varchar('liveUrl', { length: 500 }),
  viewCount: integer('viewCount').notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deletedAt', { withTimezone: true }),
});

export const caseTranslation = pgTable('case_translation', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('caseId').notNull().references(() => caseEntity.id, { onDelete: 'cascade' }),
  locale: localeEnum('locale').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  summary: text('summary').notNull(), // card blurb
  body: text('body').notNull(), // full case page, markdown
  seoTitle: varchar('seoTitle', { length: 255 }),
  seoDescription: varchar('seoDescription', { length: 500 }),
}, (t) => [
  uniqueIndex('U_case_translation_case_locale').on(t.caseId, t.locale),
  uniqueIndex('U_case_translation_locale_slug').on(t.locale, t.slug),
]);

export const caseTechnology = pgTable('case_technology', {
  caseId: uuid('caseId').notNull().references(() => caseEntity.id, { onDelete: 'cascade' }),
  technologyId: uuid('technologyId').notNull().references(() => technology.id, { onDelete: 'cascade' }),
}, (t) => [uniqueIndex('U_case_technology').on(t.caseId, t.technologyId)]);
```

Cover + gallery images: `file.externalId = case.id`, `module: 'PUBLIC'`, `isCover` marks the card thumbnail, `position` orders the rest of the gallery.

## 7. Posts (+ Comments)

**Revised after Phase 4 shipped a dual-translation Post editor: a post is NOT bilingual.** Unlike Hero/About/SiteSettings/Case, a blog post is written once, in exactly one language — there's no expectation that every article gets both an RU and an EN version, and forcing a dual-entry editor onto something that's fundamentally single-language content made the admin UI actively worse (an admin creating a post in one language still had to satisfy `required` fields in the other, hidden tab — see `06-master-roadmap.md` §2.5 for the browser-validation bug this produced). Fixed by dropping `post_translation` entirely and merging its fields directly onto `post`, with a `locale` column fixed at creation:

```ts
export const post = pgTable('post', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorUserId: uuid('authorUserId').notNull().references(() => user.id),
  status: contentStatusEnum('status').notNull().default('DRAFT'),
  publishedAt: timestamp('publishedAt', { withTimezone: true }),
  viewCount: integer('viewCount').notNull().default(0),
  locale: localeEnum('locale').notNull(), // fixed at creation — not a translation, the language this post is written in
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  excerpt: text('excerpt').notNull(),
  body: text('body').notNull(), // markdown/MDX
  seoTitle: varchar('seoTitle', { length: 255 }),
  seoDescription: varchar('seoDescription', { length: 500 }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deletedAt', { withTimezone: true }),
}, (t) => [
  uniqueIndex('U_post_locale_slug').on(t.locale, t.slug),
]);
```

Public reads (`GET /posts?locale=`) filter by `locale` directly — a post written in `en` simply doesn't appear when browsing the `ru` site, no fallback or cross-locale display. The admin editor lost `TranslationTabs` entirely in favor of one flat form plus a `locale` picker shown only at creation (fixed afterward, since changing it after publishing would silently move the post's URL to a different locale prefix with no redirect). `PostDto`'s old `alternates` field (sibling-locale slugs, for hreflang) was removed along with it — there's no sibling to link to anymore.

Ordering is by `publishedAt desc` — no manual `position` column (unlike Cases, a blog isn't manually curated). Cover image via the same `file` association. **Not building now:** tags/categories — not in the original brief; add later as a straightforward `tag`/`post_tag` join if it comes up, don't build it speculatively.

**Comments** — in-house per the earlier decision, no translation table (user-generated, not admin-authored):

```ts
export const commentStatusEnum = pgEnum('CommentStatus', ['PENDING', 'APPROVED', 'REJECTED', 'SPAM']);

export const comment = pgTable('comment', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('postId').notNull().references(() => post.id, { onDelete: 'cascade' }),
  parentCommentId: uuid('parentCommentId').references((): any => comment.id, { onDelete: 'cascade' }), // threaded replies
  authorName: varchar('authorName', { length: 100 }).notNull(),
  authorEmail: varchar('authorEmail', { length: 255 }), // moderation contact only, never rendered publicly
  authorUrl: varchar('authorUrl', { length: 500 }),
  body: text('body').notNull(),
  status: commentStatusEnum('status').notNull().default('PENDING'),
  locale: localeEnum('locale').notNull(), // which language it was written in, for admin filtering
  ipAddressHash: varchar('ipAddressHash', { length: 64 }), // hashed, not raw — spam/rate-limit use only
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deletedAt', { withTimezone: true }),
}, (t) => [
  index('IDX_comment_postId').on(t.postId),
  index('IDX_comment_status').on(t.status),
]);
```

Moderation queue is just `WHERE status = 'PENDING'` — no separate queue table. Public API only ever returns `status = 'APPROVED'` comments.

**Anti-spam on the public submit endpoint.** The template already ships a full captcha subsystem (`apps/backend/src/modules/captcha`) — challenge/asset/attempt/policy tables, an SVG generator, a Redis-backed asset pool, currently wired to `CaptchaChallengeContext.LOGIN | REGISTER | PASSWORD_RESET | API_SENSITIVE_ACTION` (`apps/backend/src/modules/captcha/domain/captcha.types.ts`). Rather than building new spam infrastructure, add one enum value, `COMMENT_SUBMIT`, to `CaptchaChallengeContext`, and require a `PASSED` challenge id in `POST /posts/:slug/comments`'s payload — the handler verifies it via the existing `CaptchaRepository`/`VerifyCaptchaChallengeCommand` path before inserting the comment. This reuses `00-audit.md` §5's existing BullMQ/Redis captcha pool as-is; the only new work is the one enum value and the check in `CreateCommentHandler`. On top of that, a honeypot field (a hidden input real users never fill, validated in the DTO and never persisted) is added as a second, zero-infrastructure layer against unsophisticated bots that skip solving the captcha entirely and just POST directly.

**Addendum, found in Phase 4 — the enum value alone doesn't make the flow work end-to-end.** Adding `COMMENT_SUBMIT` to the context enum is necessary but not sufficient: challenge creation resolves a template by code (default `svg-text-ru-v1`) and requires an *active* config plus a non-empty Redis pool of pre-generated assets for the requested difficulty — none of which existed on a fresh install, so every real challenge request 404d with `captcha.template.notFound` until this was caught while testing the comment flow. Two additions closed the gap, neither anticipated here: a `CaptchaTemplateSeedService` (seeds the default template + an active config on first boot, same mechanism as the Hero/About/SiteSetting seeds in §3) and a `CaptchaPoolReplenishmentService` (`@Cron`, tops up any template/difficulty pool that drops below a watermark — otherwise the pool drains to zero again over time as real submissions consume it, since nothing else in this design replenishes it automatically).

## 8. Navigation

```ts
export const navigationItem = pgTable('navigation_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parentId').references((): any => navigationItem.id, { onDelete: 'cascade' }), // flat today, cheap to keep nestable
  url: varchar('url', { length: 500 }).notNull(), // relative path, anchor, or external URL — frontend doesn't need it strongly typed
  position: integer('position').notNull().default(0),
  isVisible: boolean('isVisible').notNull().default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const navigationItemTranslation = pgTable('navigation_item_translation', {
  id: uuid('id').primaryKey().defaultRandom(),
  navigationItemId: uuid('navigationItemId').notNull().references(() => navigationItem.id, { onDelete: 'cascade' }),
  locale: localeEnum('locale').notNull(),
  label: varchar('label', { length: 100 }).notNull(),
}, (t) => [uniqueIndex('U_navigation_item_translation_item_locale').on(t.navigationItemId, t.locale)]);
```

## 9. Analytics

Per the decision to start simple: no new content table at all — `case.viewCount` and `post.viewCount` (already defined in §6/§7) are incremented directly. Dedup (avoid one visitor inflating the count on refresh) is a Redis `SETNX`-style key (`viewed:{entityType}:{entityId}:{sessionHash}`, short TTL e.g. 30 min) checked before the increment — reuses the existing Redis connection, no new infra. No separate `page_view` events table, no aggregation job. If per-day breakdowns are ever wanted later, that's a distinct, explicitly-scoped extension, not built now.

**Built as described in Phase 3** (`common/view-tracking/`), with one correction: neither this section nor `03-backend-build-order.md`'s per-module notes ever specified the actual `POST /cases/:slug/view` / `POST /posts/:slug/view` endpoints that trigger the increment — only the dedup mechanism itself was written down. See `03` §3a for the retroactive addendum. The visitor hash is a SHA-256 of IP+User-Agent (not a session id — there's no session concept for anonymous public visitors on this site), which is what the frontend's Route Handler proxies (`04-frontend-architecture.md` §7/§8) forward `X-Forwarded-For`/`User-Agent` for.

**Trade-off, accepted deliberately:** a single `UPDATE ... SET viewCount = viewCount + 1` per view means a viral spike (e.g. a post hitting the front page of an external aggregator) would serialize writes on one row. This is intentionally not solved now — buffering writes (e.g. batching increments in Redis and flushing periodically) is exactly the "real-time pipeline" complexity this decision chose to avoid, and for a personal site's normal traffic it's not a real bottleneck. Revisit only if it's ever actually observed, not preemptively.

## 10. CASL Subjects/Actions matrix

New `Subjects` enum values (added to **both** `apps/backend/src/enums/subjects.enum.ts` and the duplicate `pgEnum` in `libs/database/users.schema.ts` — per the audit's caveat, these must be updated together by hand):

```
HERO, ABOUT, CONTACT, TECHNOLOGY, CASE, POST, COMMENT, NAVIGATION, SITE_SETTING
```

`Actions` stays exactly as-is (`CREATE`/`READ`/`UPDATE`/`DELETE`) — no new actions needed. Publish/unpublish is just an `UPDATE` that changes `status`; comment approve/reject is just an `UPDATE` that changes `status` on `COMMENT`.

| Subject | Public REST (no guard) | Admin REST (`@Policy`) |
|---|---|---|
| HERO | `GET /hero` | `UPDATE` only (singleton, no create/delete) |
| ABOUT | `GET /about` | `UPDATE` only |
| CONTACT | `GET /contacts` (visible only) | full CRUD |
| TECHNOLOGY | `GET /technologies` | full CRUD |
| CASE | `GET /cases`, `GET /cases/:slug` (published only) | full CRUD |
| POST | `GET /posts`, `GET /posts/:slug` (published only) | full CRUD |
| COMMENT | `GET /posts/:slug/comments` (approved only), `POST /posts/:slug/comments` (public submit, unauthenticated, lands as `PENDING`) | `READ`/`UPDATE` (moderation queue, approve/reject), `DELETE` |
| NAVIGATION | `GET /navigation` (visible only) | full CRUD |
| SITE_SETTING | `GET /site-settings` | `UPDATE` only (singleton) |

Every admin-gated route follows the existing `@UseGuards(JwtAuthGuard, PoliciesGuard)` + `@Policy(Actions.X, Subjects.Y)` pattern (`apps/backend/src/modules/users/presentation/controllers/user-role.controller.ts` is the reference example). Public routes above have **no** guard at all — they're plain unauthenticated REST endpoints, matching how public content should be exposed (there is no "PUBLIC role ability check" involved; it's simply the absence of a guard).

Only the `ADMIN` role is granted these new abilities (single-operator site — no `EDITOR`/other content roles are introduced; add later only if a real second-operator need appears).

## 11. What's explicitly deferred, not built now

- Post tags/categories.
- Real-time analytics pipeline (Redis buffering + periodic flush) — current scope is a plain counter with session-based dedup.
- A generic multi-entity-type "gallery" abstraction beyond `file.position`/`isCover` — revisit only if a content type needs materially different media semantics.
- A second content-editor role distinct from `ADMIN`.
- Site-wide search (a `search_document` table indexing `{entityType, entityId, locale, title, content}` across Posts/Cases) — real future need once there's enough content to search, but not MVP; Postgres full-text search (`tsvector`) on the existing translation tables would likely suffice before reaching for anything heavier like Elasticsearch (`00-audit.md` §10 — Elasticsearch is currently an optional log sink only, not something this project needs to adopt for content search).

---

**Next:** `03-backend-build-order.md` and `01`'s remaining infra work can proceed in parallel now that this is settled — `03` first, since it directly consumes this doc's table/module list.
