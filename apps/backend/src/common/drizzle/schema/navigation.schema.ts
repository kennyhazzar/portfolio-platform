import { pgTable, uuid, varchar, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { localeEnum } from './shared.schema';

// navigation_item — flat today, but self-referencing parentId is cheap to keep for nested menus later.
// See docs/planning/02-content-model.md §8.
export const navigationItem = pgTable('navigation_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parentId').references((): any => navigationItem.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  position: integer('position').notNull().default(0),
  isVisible: boolean('isVisible').notNull().default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const navigationItemTranslation = pgTable(
  'navigation_item_translation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    navigationItemId: uuid('navigationItemId')
      .notNull()
      .references(() => navigationItem.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    label: varchar('label', { length: 100 }).notNull(),
  },
  (t) => [uniqueIndex('U_navigation_item_translation_item_locale').on(t.navigationItemId, t.locale)],
);
