import { pgEnum } from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('Locale', ['ru', 'en']);
export const contentStatusEnum = pgEnum('ContentStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
