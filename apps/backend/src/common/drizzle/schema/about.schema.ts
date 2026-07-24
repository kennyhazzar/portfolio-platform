import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { localeEnum } from './shared.schema';

// about table — singleton (one row, seeded via migration, no create/delete endpoint).
// See docs/planning/02-content-model.md §3.
export const about = pgTable('about', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const aboutTranslation = pgTable(
  'about_translation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    aboutId: uuid('aboutId')
      .notNull()
      .references(() => about.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    bio: text('bio').notNull(),
  },
  (t) => [uniqueIndex('U_about_translation_about_locale').on(t.aboutId, t.locale)],
);
