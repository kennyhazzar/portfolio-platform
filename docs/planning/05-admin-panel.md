# 05 — Admin panel

> Depends on `01` (lives inside `apps/frontend`, FSD layers from `04` §10), `02` (fields/associations to expose CRUD for, `position` columns), `03` (which admin endpoints exist, in what order they're built), `04` (Tailwind+shadcn, auth flow, no global state store). Last detail doc before `06-master-roadmap.md`.

## 1. Shared building blocks (built once, reused across every module screen)

Rather than one bespoke screen per module, four `shared`/`widgets` primitives (FSD, `04` §10) cover every module below. **All four are now built** — `FileUploadField`/`MediaGalleryField` were deferred out of the original Phase 4 pass and picked back up afterward (see `06-master-roadmap.md` §2.5).

- **`shared/ui/TranslationTabs`** — a RU/EN tab switcher wrapping any form body, for entities that are genuinely bilingual (Hero/About/SiteSettings/Case — **not** Post, see `02-content-model.md` §7). Submits both locales in one request — matches `02-content-model.md`'s admin-endpoint shape (`GET` returns all translations, `PATCH`/`POST` accepts `translations: { ru: {...}, en: {...} }`) from a single Server Action, not two separate saves. **Built as designed** — both locale panels stay mounted at all times (toggled via CSS `hidden`, not conditional rendering) so switching tabs never drops unsaved field state. **Bug found and fixed after Phase 4 shipped:** hiding the inactive panel via `display:none` makes its fields un-focusable, and a `required` field inside an un-focusable panel makes the *entire form* silently unsubmittable — the browser throws `An invalid form control with name='' is not focusable` and blocks the click with no visible error, which looked exactly like a dead "Create" button. Every affected form now sets `noValidate` on the `<form>` and does its own explicit required-field check across both locales before submitting, showing a real error message instead of failing silently.
- **`widgets/admin/FileUploadField`** — single-file upload (Hero/About photo, About résumé, Site Settings favicon, Post cover): click-to-browse, shows a thumbnail (images) or a filename link (documents), replace re-uploads with the same fixed slot `name` (e.g. `"cover"`, `"photo"`, `"resume"`, `"favicon"`) so the existing `(name, module, externalId)` unique constraint's `onConflictDoUpdate` overwrites the previous file in place — no separate "delete old, then insert new" step needed. A `multiple` sibling, `widgets/admin/MediaGalleryField`, handles Case's gallery: multi-upload (each gets a generated unique name so same-named originals never collide), per-file remove, drag-and-drop reorder via the same `SortableList`/`position` mechanism below, and one file flagged `isCover` via a radio control (`PATCH /admin/files/:id/cover`, unsets any previous cover for that entity). **Built.** Backend: `FileDto` gained the previously-missing `type`/`position`/`isCover` fields (only `position`/`isCover` had been added to the schema in Phase 1 — `type` had never been exposed on the DTO at all, an oversight caught while wiring this up); a new `FileAdminController` (`GET/POST /admin/files`, `PATCH /admin/files/reorder`, `PATCH /admin/files/:id/cover`, `DELETE /admin/files/:id`) gated on the existing `Subjects.FILE_ADMIN` (already seeded for the Administrator role — no `roles.config.ts` change needed, unlike every other new Subject added this project). Case/Post's `Delete*Handler`s now also call `FileRepository.deleteByExternalId` so deleting an entity cleans up its attached files instead of leaving orphan rows (the cross-module port `02-content-model.md` §1 designed for this was skipped in favor of directly injecting `FileRepository`, since `FileModule` is already `@Global()` in this app — the extra abstraction layer wasn't buying anything a microservice-boundary port would).
- **`widgets/admin/SortableList`** — drag-and-drop reordering (via `dnd-kit`, kept to this one shared component rather than a bespoke drag implementation per screen), used by Technology, Navigation, Contact, and now `MediaGalleryField` above. Reordering is optimistic in the UI, then persisted via one bulk call — see §2, a small addition to the admin API surface `03` didn't originally spec. **Built as designed**, including for Case (which also has manual `position` ordering, per `02-content-model.md` §6). The drag handle is its own element passed to `renderItem`, not the whole row, so buttons/inputs inside each row stay clickable during drag.
- **`widgets/admin/StatusControl`** — the `DRAFT`/`PUBLISHED`/`ARCHIVED` control for Case/Post, a plain `Actions.UPDATE` on `status` (`02-content-model.md` §10 — there's no separate "publish" action, this is just a status change). **Built as designed.**

## 2. Addendum to `03-backend-build-order.md`: a reorder endpoint per orderable collection

`02-content-model.md` defined `position` columns on `contact`, `technology`, `case`, `navigation_item`, and the `file` table (gallery ordering), but `03`'s endpoint matrix only specced plain CRUD. Drag-and-drop reordering N items via N individual `PATCH` calls is both chattier than necessary and not atomic (a partial failure mid-drag leaves positions inconsistent). Add one endpoint per orderable collection:

```
PATCH /admin/<module>/reorder
Body: { id: string; position: number }[]
```

Handled by one command (`Reorder<Module>Command`) that updates all rows in a single transaction. Small, mechanical addition to each affected module's build step in `03` §2 — not a new module, not a schema change.

**Built, then fixed once for a real correctness gap.** The first implementation of `Reorder<Module>Command` was N sequential `UPDATE ... WHERE id = ?` statements inside one transaction — atomic, but still N round trips, exactly the "chattier than necessary" cost this section's own rationale argues against. Caught in code review, not by any test, across all four collections (Case/Contact/Technology/Navigation). Fixed to a single `UPDATE ... FROM (VALUES ...)` statement per reorder call: one round trip regardless of item count, and the transaction wrapper is no longer needed since it's already one atomic statement.

## 3. Preview: Next.js Draft Mode, not a bespoke preview route

**Built**, matching the design below as originally written. A Case/Post in `DRAFT` status isn't visible on the public `GET /cases/:slug` endpoint (`02-content-model.md` §10 — public reads are published-only). Rather than building a separate preview page/template that has to be kept in sync with the real public one, this uses Next's built-in **Draft Mode** (`draftMode()` from `next/headers`):

- The admin editor's "Preview RU"/"Preview EN" links (shown once the corresponding locale's slug is filled in, next to `StatusControl`) open `app/api/preview/route.ts` in a new tab. It re-checks the caller is an authenticated admin the same way `04` §4's middleware gates `/admin/*` (reads the `accessToken` cookie, calls `GET /auth/me` server-to-server), calls `draftMode().enable()`, and redirects to the real public URL, `/{locale}/cases/{slug}` or `/{locale}/posts/{slug}`.
- Backend: each of `CaseAdminController`/`PostAdminController` gained `GET /admin/cases/preview/:slug` / `GET /admin/posts/preview/:slug` (`Actions.READ` on the existing `CASE`/`POST` subjects — no new role_permission rows needed), backed by `Case/PostGetBySlugAnyStatusQuery` → `Case/PostRepository.findBySlug` (any status, unlike the public `findPublishedBySlug`). Returns the same single-locale `CaseDto`/`PostDto` shape as the public endpoint, not the admin's all-translations DTO, so the preview render is identical to the eventual published page.
- The public case/post detail pages (`generateMetadata` and the page component) check `(await draftMode()).isEnabled`: if true, they call `getCasePreviewBySlug`/`getPostPreviewBySlug` (`entities/*/admin-api.ts`, JWT-forwarding like every other admin fetch) instead of the public `getCaseBySlug`/`getPostBySlug`, and the `ViewBeacon` (which would increment `viewCount`) is swapped for `widgets/exit-preview-banner.tsx` — a sticky bar with an "Exit preview" link to `app/api/preview/disable/route.ts`, which calls `draftMode().disable()` and redirects back.
- Verified end-to-end (curl smoke test, not just code review): a `DRAFT` case 404s on both the public page and the public API for a visitor with no draft-mode cookie; the same slug returns 200 with the banner once `/api/preview` has been hit as admin; hitting `/api/preview/disable` clears the cookie and the same admin immediately gets the 404 again.

## 4. Per-module screens

### Hero, About, Site Settings — singleton edit forms
One form each (`TranslationTabs` — no `FileUploadField`, see §1's status note; photo/résumé/favicon fields simply aren't in these forms), no list view, no create/delete affordance in the UI at all — matches the "no create endpoint exists" enforcement from `02-content-model.md` §3. Saving calls the single `Update*Command`. **Built.**

### Technology, Navigation, Contact — collection + reorder
List view with `SortableList`, a simple form per item (no `TranslationTabs` for Technology/Contact — neither has a translation table, per `02-content-model.md` §4/§5; Navigation does). Technology's form includes the `iconSlug` field from `02` §5 (text input; no uploaded-icon fallback, since that needs `FileUploadField`). Navigation's form includes a parent-item picker (`parentId`, currently flat but the field exists per `02` §8). **Built**, including inline create-and-edit-in-place forms per row rather than a separate edit page — reasonable given how few fields each of these three has.

### Case, Post — the two full editors
- Case: `TranslationTabs` wrapping title/slug/summary/body/SEO fields per locale (Case is genuinely bilingual). **Built**, as a dedicated `/new` create route plus a `/[id]` edit route (see `04` §1's updated route tree) rather than one route handling both.
- Post: flat single-language form (title/slug/excerpt/body/SEO), no `TranslationTabs` — a `locale` picker (RU/EN) is shown only at creation and fixed afterward, since Post isn't bilingual (`02-content-model.md` §7). **Rebuilt** after the single-locale schema change; the original bilingual editor briefly existed and was replaced, not iterated on.
- Body field (both): a markdown editor with a live preview pane rendered through the **same markdown-rendering component the public site uses** (not a separate rich-text-to-HTML editor) — keeps the storage format (`02-content-model.md` §6/§7's `body text`, markdown) and the public render path as the single source of truth for "what this will look like." **Built** (`widgets/admin/markdown-editor.tsx`, textarea + live preview side-by-side on wider screens, stacked below `lg`).
- Case only: technology multi-select backed by `case_technology`, plus repo/live URL fields, plus `MediaGalleryField` for cover + gallery screenshots. **Built.**
- Post only: author is implicitly the logged-in admin (`authorUserId`, no picker needed — single-operator site), plus `FileUploadField` for the cover image. **Built.**
- `StatusControl` on both — **built**. "Preview" (§3) — **built**: Case shows "Preview RU"/"Preview EN" links (one per locale it actually has); Post shows a single "Preview" link (its one fixed locale).

### Contacts platform picker
Simple enum dropdown (`ContactPlatform`) + a `value` field (URL/handle/email) + `isVisible` toggle — the simplest screen in the whole panel, per `03-backend-build-order.md` §3's note that it's independent of everything and could slot in anywhere. **Built.**

### Comments — moderation queue, not a CRUD screen
A filtered list (default filter: `status = PENDING`) showing author name, body, the post it belongs to, locale, and submission date. Row actions: **Approve**, **Reject**, **Mark spam**, **Delete** — each a plain `Actions.UPDATE`/`DELETE` on `Subjects.COMMENT`. No admin "create comment" affordance exists (comments only originate from the public submit endpoint, per `02-content-model.md` §10). No bulk actions for now — one row at a time is enough at this project's expected comment volume; revisit only if moderation volume ever makes that painful. **Built** — status filter is a `?status=` query param with tab links (server-rendered per filter, not a client-side re-fetch), and the post each comment belongs to is resolved via one batched lookup of the full posts-admin list rather than one query per comment.

## 5. Admin shell

`widgets/admin/AdminSidebar` — one fixed-language navigation listing every module above, plus logout. Lives inside `app/admin/(protected)/layout.tsx` (`04` §1's updated route tree — split from `app/admin/layout.tsx` so the unauthenticated login page doesn't get sidebar chrome), gated by the same middleware auth check. No locale switcher in the admin chrome itself (`04` §1 — admin isn't bilingual content, it's an operator tool).

**Responsive redesign, added post-Phase-4 (`04` §14):** the sidebar as originally built was a fixed `w-[220px]` flex sibling of the content area with no mobile fallback — a real gap, not cosmetic, since it would have left almost no usable width for content on a phone. `AdminSidebar` is now itself responsive: below `lg` it renders as a sticky top bar (logo + hamburger button) with a full-width slide-down drawer holding the nav links plus the user label and logout button; at `lg` and above it renders the original fixed sidebar unchanged. The parent layout switched from `flex` to `flex flex-col lg:flex-row` to match, and the main content area got `min-w-0` so its own children (list rows with several inline fields) can shrink and wrap properly instead of forcing horizontal overflow.

## 6. What's deferred, not built now

- Bulk moderation actions (bulk-approve, bulk-delete comments).
- Content revision history / edit audit trail beyond the existing `access_log` (`00-audit.md` §6).
- A block-based/WYSIWYG editor beyond markdown + live preview.
- Multi-operator workflows (assignment, review/approval between two admin accounts) — `02-content-model.md` §10 already deferred a second content-editor role; this is the UI-side consequence of that same deferral.

`FileUploadField`/`MediaGalleryField`, the only item deferred out of this doc's original design, was picked back up and built (§1) — nothing from the original §1/§4/§5 design remains outstanding. The items above are net-new scope, not carried-over deferrals.

---

**Next:** `06-master-roadmap.md` — the index tying `00`–`05` together into phases with a definition of done per phase. All five detail docs are now settled.
