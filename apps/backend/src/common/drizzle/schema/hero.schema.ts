import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { localeEnum } from './shared.schema';

// hero table — singleton (one row, seeded via migration, no create/delete endpoint).
// See docs/planning/02-content-model.md §3.
export const hero = pgTable('hero', {
  id: uuid('id').primaryKey().defaultRandom(),
  ctaUrl: varchar('ctaUrl', { length: 500 }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const heroTranslation = pgTable(
  'hero_translation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    heroId: uuid('heroId')
      .notNull()
      .references(() => hero.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    headline: varchar('headline', { length: 500 }),
    description: text('description'),
    ctaLabel: varchar('ctaLabel', { length: 255 }),
  },
  (t) => [uniqueIndex('U_hero_translation_hero_locale').on(t.heroId, t.locale)],
);
