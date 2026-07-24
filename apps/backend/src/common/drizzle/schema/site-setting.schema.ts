import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { localeEnum } from './shared.schema';

// site_setting table — singleton, parallel to (not a replacement for) the existing
// system_setting KV table, which stays reserved for non-content operational flags.
// See docs/planning/02-content-model.md §2.
export const siteSetting = pgTable('site_setting', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettingTranslation = pgTable(
  'site_setting_translation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteSettingId: uuid('siteSettingId')
      .notNull()
      .references(() => siteSetting.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    brandName: varchar('brandName', { length: 100 }),
    description: text('description').notNull(),
    footerText: text('footerText'),
    copyrightText: varchar('copyrightText', { length: 255 }),
    defaultSeoTitle: varchar('defaultSeoTitle', { length: 255 }),
    defaultSeoDescription: varchar('defaultSeoDescription', { length: 500 }),
  },
  (t) => [uniqueIndex('U_site_setting_translation_locale').on(t.siteSettingId, t.locale)],
);
