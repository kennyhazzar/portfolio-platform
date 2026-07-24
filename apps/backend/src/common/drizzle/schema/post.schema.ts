import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from '@libs/database/users.schema';
import { contentStatusEnum, localeEnum } from './shared.schema';

/**
 * See docs/planning/02-content-model.md §7. Unlike Case/Hero/About/SiteSettings, a post is NOT
 * bilingual — each post is written once, in exactly one language (`locale`), no forced RU+EN
 * pair. Decided after Phase 4 shipped a dual-translation editor for Post that made no sense for
 * a personal blog (see docs/planning/06-master-roadmap.md §2.5). Ordered by publishedAt desc — no
 * manual `position` column, unlike Case (a blog isn't manually curated).
 */
export const post = pgTable(
  'post',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorUserId: uuid('authorUserId')
      .notNull()
      .references(() => user.id),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    publishedAt: timestamp('publishedAt', { withTimezone: true }),
    viewCount: integer('viewCount').notNull().default(0),
    locale: localeEnum('locale').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    excerpt: text('excerpt').notNull(),
    body: text('body').notNull(),
    seoTitle: varchar('seoTitle', { length: 255 }),
    seoDescription: varchar('seoDescription', { length: 500 }),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
  },
  (t) => [uniqueIndex('U_post_locale_slug').on(t.locale, t.slug)],
);
