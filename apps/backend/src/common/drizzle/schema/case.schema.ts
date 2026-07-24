import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { contentStatusEnum, localeEnum } from './shared.schema';
import { technology } from './technology.schema';

// "case" is quoted throughout — it's a SQL reserved word, safe under a quoted identifier
// like the existing "user"/"file-version" tables. See docs/planning/02-content-model.md §6.
export const caseEntity = pgTable('case', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: contentStatusEnum('status').notNull().default('DRAFT'),
  publishedAt: timestamp('publishedAt', { withTimezone: true }),
  position: integer('position').notNull().default(0),
  repoUrl: varchar('repoUrl', { length: 500 }),
  liveUrl: varchar('liveUrl', { length: 500 }),
  viewCount: integer('viewCount').notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deletedAt', { withTimezone: true }),
});

export const caseTranslation = pgTable(
  'case_translation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('caseId')
      .notNull()
      .references(() => caseEntity.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    summary: text('summary').notNull(),
    body: text('body').notNull(),
    seoTitle: varchar('seoTitle', { length: 255 }),
    seoDescription: varchar('seoDescription', { length: 500 }),
  },
  (t) => [
    uniqueIndex('U_case_translation_case_locale').on(t.caseId, t.locale),
    uniqueIndex('U_case_translation_locale_slug').on(t.locale, t.slug),
  ],
);

export const caseTechnology = pgTable(
  'case_technology',
  {
    caseId: uuid('caseId')
      .notNull()
      .references(() => caseEntity.id, { onDelete: 'cascade' }),
    // restrict, not cascade — deleting a technology still referenced by a case should surface a
    // clear error, not silently vanish from case listings. See docs/planning/03-backend-build-order.md §3.
    technologyId: uuid('technologyId')
      .notNull()
      .references(() => technology.id, { onDelete: 'restrict' }),
  },
  (t) => [uniqueIndex('U_case_technology').on(t.caseId, t.technologyId)],
);
