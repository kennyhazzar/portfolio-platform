import { pgTable, uuid, varchar, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// No translation table — tech names are proper nouns. See docs/planning/02-content-model.md §5.
export const technologyCategoryEnum = pgEnum('TechnologyCategory', [
  'LANGUAGE',
  'FRAMEWORK',
  'LIBRARY',
  'DATABASE',
  'STORAGE',
  'INFRA',
  'PROTOCOL',
  'ARCHITECTURE',
  'AUTH',
  'TESTING',
  'TOOL',
  'OTHER',
]);

export const technology = pgTable(
  'technology',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    category: technologyCategoryEnum('category').notNull().default('OTHER'),
    // e.g. a simple-icons slug — avoids requiring a file upload per logo; falls back to an
    // uploaded `file` (type IMAGE) via the polymorphic association when null.
    iconSlug: varchar('iconSlug', { length: 100 }),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('IDX_technology_position').on(t.position)],
);
