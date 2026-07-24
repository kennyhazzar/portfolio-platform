import { pgTable, uuid, varchar, integer, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// No translation table — the display label is derived from `platform` via the frontend's own
// static UI-string dictionary (chrome text, not admin-authored content). See
// docs/planning/02-content-model.md §4.
export const contactPlatformEnum = pgEnum('ContactPlatform', [
  'GITHUB',
  'TELEGRAM',
  'HABR_CAREER',
  'EMAIL',
  'LINKEDIN',
  'OTHER',
]);

export const contact = pgTable(
  'contact',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: contactPlatformEnum('platform').notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    position: integer('position').notNull().default(0),
    isVisible: boolean('isVisible').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('IDX_contact_position').on(t.position)],
);
