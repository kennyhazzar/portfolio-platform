# 00 — Audit: what exists today and what it means for Portfolio Platform

> Status: reference snapshot, not a design doc. Later docs (`01`–`06`) build on these facts without re-verifying them. Every claim below cites the file(s) it's based on. Where something doesn't exist, that's stated plainly rather than guessed at.

## 1. Overall maturity assessment

The template (`nest-rest-backend-template`) is a genuinely production-oriented NestJS + Fastify backend, not a toy scaffold: it has real RBAC, real event-driven fan-out between modules, real background job processing, a working two-service gRPC split, and Docker Compose covering every infra dependency it declares. Its main gap is test depth (see §8) and a couple of "scaffolded but not yet exercised" corners (integration tests, feature flags).

**Strong:**
- Consistent DDD layering enforced across almost every module (§2) — not just in one showcase module.
- RBAC (CASL) is a real, working guard/decorator/ability-cache system, not just enums sitting unused (§6).
- Cross-module decoupling via NestJS CQRS `EventBus` is demonstrably used for real fan-out, not just wired and ignored (§4).
- BullMQ queues process real jobs (mail sending, notification dispatch, captcha pre-generation), shared over Redis across both services (§5).
- File/media handling (S3-compatible, versioned, Postgres-backed metadata) is already a solid, reusable subsystem (§7).

**Weak / thin:**
- Test coverage: 12 unit spec files, 0 integration tests (config scaffolded, unused), 1 e2e test (§8).
- No feature-flag service — the only DB-backed configuration mechanism is a flat key/value table with no typed flag layer (§3).
- i18n is real but narrow in scope — message/error translation only, not content translation (§3.1). This isn't a defect in the template (it was never meant to serve bilingual public content), just a boundary the new project must design around.
- Naming is slightly inconsistent (`file-version` hyphenated table name vs. snake_case everywhere else) — worth standardizing going forward, not worth fixing retroactively.
- No frontend anywhere in the repo (§9).

## 2. Module structure / DDD layering

Every module under `apps/backend/src/modules/*` follows the same four-layer split:

```
domain/         entities, repository ports (abstract classes/interfaces)
application/    commands/, queries/, handlers/, events/  — NestJS CQRS CommandBus/QueryBus/EventBus
infrastructure/ Drizzle repository implementations, adapters
presentation/   controllers, dtos/, mappers/
```

Representative example — `users` module:
- Domain: `apps/backend/src/modules/users/domain/entities/user.entity.ts`, `apps/backend/src/modules/users/domain/repositories/user.repository.ts` (abstract port)
- Application: `apps/backend/src/modules/users/application/commands/user-create.command.ts` + `apps/backend/src/modules/users/application/handlers/user-create.handler.ts` + `apps/backend/src/modules/users/application/queries/user-get.query.ts`
- Infrastructure: `apps/backend/src/modules/users/infrastructure/repositories/drizzle/user-repository.drizzle.ts`, wired via `{ provide: UserRepository, useClass: UserRepositoryDrizzle }` in `users.module.ts`
- Presentation: `apps/backend/src/modules/users/presentation/controllers/user.controller.ts`, DTOs in `presentation/dtos`, mappers in `presentation/mappers`

Same shape in `admin`, `file`, `mail`, `notification`, `captcha` (captcha additionally has `application/ports` for its generator/hashing ports). Exceptions: `health` (plain Terminus module, no CQRS — `health.module.ts` + `health.controller.ts` + a Drizzle health indicator) and `migration` (seed services only — `migration.service.ts`, `roles-seed.service.ts`, `user-seed.service.ts`, no domain/application/presentation split, which is appropriate for a bootstrap/seed module).

`apps/auth-service/src/modules/auth` follows the identical layering, but presentation is gRPC-only (`apps/auth-service/src/modules/auth/presentation/auth.grpc.controller.ts`), no REST controllers.

**Verdict for new modules:** reuse this layering exactly — it's consistent, well-understood, and every new content module (Hero, About, Posts, Cases, Comments, etc.) should follow it without modification.

## 3. Settings, config, and feature flags

**No `modules/settings`.** "Settings" is a DB-backed key/value table plus admin endpoints, living inside the `admin` module:
- Schema: `apps/backend/src/common/drizzle/schema/admin.schema.ts` — `system_setting` table (`key` varchar PK, `value` text, `updatedAt`).
- CQRS: `apps/backend/src/modules/admin/application/queries/admin.queries.ts` (`SystemSettingsQuery`), `apps/backend/src/modules/admin/application/commands/admin.commands.ts` (`SystemSettingUpdateCommand`), handled in `apps/backend/src/modules/admin/application/handlers/admin.handlers.ts` via Drizzle `onConflictDoUpdate` upsert.
- REST: `apps/backend/src/modules/admin/presentation/controllers/admin.controller.ts` — `GET/PATCH /admin/system-settings`, gated by `@Policy(Actions.READ/UPDATE, Subjects.ADMIN_SETTINGS)`.
- Static app config (environment-level, not site content) is separate: `config.yaml.example` / `config.production.yaml.example`, loaded via `@nestjs/config`. Sections: `log`, `settings` (language/locale/country defaults), `admin` (bootstrap admin credentials), `host`, `swagger`, `database`, `redis`, `jwt`, `security`, `grpc`, `auth` (cookie/CSRF modes), plus optional `mailer`/`s3`/`graylog`, and prod-only `cors`/`throttle`.

**No typed feature-flag service** — the `system_setting` table is untyped string key/value with no consuming abstraction beyond the two admin endpoints.

**Verdict:** the Site Settings module (favicon/title/description/footer/copyright) can extend this existing pattern — `02-content-model.md` needs to decide whether it reuses `system_setting` directly or gets its own typed table (open decision, flagged for that doc).

### 3.1 i18n — scope and limits

Custom, hand-rolled service — **not** `nestjs-i18n`:
- `apps/backend/src/i18n/i18n.module.ts` (`@Global()`), `apps/backend/src/i18n/i18n.service.ts` — loads static JSON dictionaries from `apps/backend/src/i18n/{en,ru}/{common,notification,user,validation}.json`. Locale type is hardcoded `'en' | 'ru'`.
- Request-scoped resolution: `apps/backend/src/interceptors/language.interceptor.ts` (`LanguageInterceptor`) reads `x-language`/`x-lang`/query `lang`/`Accept-Language`, sets `req.language`, and **post-processes every HTTP response body**, walking the JSON and translating any `message` field, appending a `messageKey`.
- Genuinely used, not just scaffolding: e.g. `throw new UnauthorizedException('user.auth.invalidJwtPayload')` in `apps/backend/src/modules/users/infrastructure/strategies/jwt.strategy.ts`, `'file.invalidUploadParameters'` in `apps/backend/src/modules/file/infrastructure/adapters/s3.adapter.ts`.
- **This system only translates API messages/errors.** It has no concept of translating entity/content fields (no translated DB columns, no per-entity locale resolution). It is the wrong mechanism for bilingual Hero/About/Posts/Cases content — a separate content-localization mechanism is required (designed in `02-content-model.md`), and the two systems will coexist without conflict (message i18n stays as-is for errors/validation; content localization is new and orthogonal).

## 4. EventBus / domain events

Real usage of NestJS CQRS `EventBus` in `apps/backend`; none observed in `auth-service`.
- Events: `apps/backend/src/modules/users/application/events/user-created.event.ts`, `auth.events.ts` (`PasswordResetRequestedEvent`, `PasswordChangedEvent`, `AdminPasswordResetRequestedEvent`, `PasswordResetCompletedEvent`, `UserLoginFailedEvent`, `UserLoginSucceededEvent`, `UserLoggedOutEvent`).
- Publishers: e.g. `apps/backend/src/modules/users/application/handlers/user-create.handler.ts:57` — `this.eventBus.publish(new UserCreatedEvent(...))`; same pattern in `user-login.handler.ts`, `change-password.handler.ts`, `forgot-password.handler.ts`, `reset-password.handler.ts`, `admin-reset-password.handler.ts`, `user-logout.handler.ts`.
- Consumers demonstrate real one-to-many fan-out across module boundaries:
  - `apps/backend/src/modules/notification/application/handlers/events/user-created-event.handler.ts` (creates an in-app notification)
  - `apps/backend/src/modules/mail/application/handlers/events/user-created-email-event.handler.ts` (queues a welcome email via BullMQ — its own docblock frames it as "Event-Driven Architecture with multiple handlers for one event")
  - `apps/backend/src/modules/admin/application/handlers/events/auth-audit.handlers.ts` (audit-log writer for the `access_log` table)

**Verdict:** directly reusable for e.g. a `PostPublishedEvent` triggering sitemap/cache invalidation, or a `CommentSubmittedEvent` triggering an admin notification.

## 5. Queue system

BullMQ (`@nestjs/bullmq`), real jobs in both apps, not just scaffolding.
- Config: `apps/backend/src/options/bullmq.module.options.ts`, `apps/auth-service/src/options/bullmq.module.options.ts` (Redis connection, per-environment DB index).
- Real processors: `apps/backend/src/modules/mail/infrastructure/processors/mail.processor.ts` (`@Processor('mail')`, sends real email), `apps/backend/src/modules/notification/infrastructure/processors/notification-dispatch.processor.ts` (`@Processor('notifications')`, retry/backoff via `getNextAttemptAt`), `apps/backend/src/modules/captcha/infrastructure/processors/captcha-generation.processor.ts` (pre-generates captcha SVGs into a Redis-backed pool).
- Cross-service: `apps/auth-service/src/modules/auth/infrastructure/services/mail-producer.service.ts` enqueues mail jobs consumed by backend's `mail.processor.ts` via shared Redis.

**Verdict:** reusable as-is for async work in new modules (e.g. thumbnail generation for Media, periodic view-count flush for Analytics if it ever grows beyond the simple counter).

## 6. RBAC / CASL

- Ability building: `apps/backend/src/factories/casl-ability.factory.ts` — `CaslAbilityFactory.createForRolePermissions()`.
- Caching: `apps/backend/src/modules/users/infrastructure/services/policies.service.ts` (`PoliciesService`) — one `AppAbility` cached per `RoleType`, populated in `onModuleInit`.
- Guard/decorator: `apps/backend/src/guards/policies.guard.ts` (`PoliciesGuard`) + `apps/backend/src/decorators/policy.decorator.ts` (`@Policy(action, subject)`), reading `roleType` off `req.user` (set by `JwtAuthGuard`/Passport).
- Example: `apps/backend/src/modules/users/presentation/controllers/user-role.controller.ts` — `@UseGuards(JwtAuthGuard, PoliciesGuard)` at controller level, `@Policy(Actions.READ, Subjects.USER_ROLE)` etc. per route. Same pattern in `apps/backend/src/modules/admin/presentation/controllers/admin.controller.ts`.
- Enums: `apps/backend/src/enums/actions.enum.ts`, `apps/backend/src/enums/subjects.enum.ts`. Role → permission seed data: `apps/backend/src/modules/migration/configs/roles.config.ts`.

**Caveat to carry into `03-backend-build-order.md`:** the `Subjects` enum is duplicated — once as a TS enum (`enums/subjects.enum.ts`) and once as a Postgres `pgEnum` in `libs/database/users.schema.ts`. There is no single source of truth; both must be updated by hand for every new content type. This is mechanical but easy to forget — worth calling out per-module in the build-order doc, not batching it at the end.

## 7. File/media module

Uses an S3-compatible adapter (works against MinIO per Docker config) with Postgres-stored metadata:
- Adapter: `apps/backend/src/modules/file/infrastructure/adapters/s3.adapter.ts` (`FileAdapter`) — builds S3 keys (transliterates Cyrillic filenames via `slugify`, preserves original name for DB display), `upload()`/`uploadBuffer()`/`uploadStream()` via `@aws-sdk/lib-storage` `MultipartUpload`, plus `head()`/`download()`/`delete()`.
- Domain: `apps/backend/src/modules/file/domain/entities/file.entity.ts` + `file-version.entity.ts` — metadata (original name, module, externalId, type, versions) persisted via `apps/backend/src/modules/file/infrastructure/repositories/file.repository.drizzle.ts`, schema in `apps/backend/src/common/drizzle/schema/file.schema.ts`.
- Flow: controller → command → handler calls `FileAdapter.upload()`, then persists a `file`/`file-version` row associating the object with a `module`/`externalId` pair.

**Verdict:** directly reusable for the Media module — the parent/child (`file`/`file-version`) pattern is also the template this project will reuse for content-translation tables (see plan's content-localization design).

## 8. Test coverage

- Unit: `jest.config.cjs`, `testMatch: apps/**/*.spec.ts`, 85% line/branch coverage threshold configured. **12 spec files** exist (encryption service, language interceptor, captcha domain/hashing services, health controller, notification handler/processor/dispatcher, users handlers for create/login/update, user entity).
- Integration: `test/jest-integration.cjs` configured (`testMatch: test/integration/**/*.spec.ts`), run via `pnpm test:integration` — **0 spec files exist**. Scaffolded, unused.
- E2E: `test/e2e/jest/jest-e2e.cjs` configured, `setupFilesAfterEnv: test/e2e/jest/jest.setup.ts` — **1 spec file**: `test/e2e/app-health.e2e-spec.ts`.
- Shared bootstrap helpers exist: `test/setup/app.ts`, `test/setup/database.ts`, `test/e2e/utils/`.

**Verdict:** real gap. `03-backend-build-order.md` should set a per-module minimum (unit + at least one integration test) so new modules don't repeat this gap, and ideally the integration-test scaffolding gets its first real usage rather than staying permanently empty.

## 9. Monorepo tooling & frontend

- **Not a real multi-package pnpm workspace today.** Only one `package.json` exists in the whole repo. `pnpm-workspace.yaml` holds only `overrides` (version pins) and `allowBuilds` — no `packages:` glob.
- The "monorepo" is NestJS CLI monorepo mode: `nest-cli.json` (`monorepo: true`, `root: apps/backend`), two projects — `backend` (`apps/backend`) and `auth-service` (`apps/auth-service`) — sharing the one root `package.json`, `tsconfig.json`, `jest.config.cjs`, `eslint.config.mjs`.
- `jest.config.cjs` `testMatch` is `apps/**/*.spec.ts` (would blindly pick up frontend test files once they exist — needs narrowing). `eslint.config.mjs` sets `sourceType: 'commonjs'` globally with `projectService: true` (auto-discovers per-file tsconfig, needs a frontend-specific rule override once added).
- **No frontend exists anywhere in the repo** — confirmed via search for `next.config*`, `.tsx`/`.jsx` files, `apps/frontend`/`apps/web`, and `react`/`next`/`react-dom` in dependencies. Zero matches outside `node_modules`.

**Verdict:** adding `apps/frontend` requires actually turning `pnpm-workspace.yaml` into a real multi-package workspace (add a `packages:` glob) — this is a genuine infra change, not a trivial addition. Full plan in `01-monorepo-and-infra.md`.

## 10. Infra / Docker (for completeness)

`docker/docker-compose.yaml` (project `nest-rest-backend-template`) defines: `postgres:17-alpine`, `redis:8-alpine`, `minio/minio:latest` + `minio-init` (bucket bootstrap), `axllent/mailpit:latest` (dev SMTP), `auth-service` (gRPC-only, `expose: 50051`, no published port), `backend` (published `3000`). All on one bridge network. No Elasticsearch container defined — `@elastic/elasticsearch`/`pino-elasticsearch` are optional log-shipping dependencies, not a content-search dependency; config has a commented-out `graylog` block as the alternative log sink. `drizzle/migrations/` currently has exactly one migration (`0000_initial.sql`, 20 tables total across `users`, `file`, `mail`, `notification`, `admin`, `captcha` schema files).

---

**Next:** `01-monorepo-and-infra.md` — concrete pnpm workspace/tsconfig/eslint/jest/Docker changes to add `apps/frontend` without disturbing the existing Nest monorepo-mode setup.
