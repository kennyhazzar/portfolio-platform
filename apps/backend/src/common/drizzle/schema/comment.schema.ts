import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, pgEnum, index, check } from 'drizzle-orm/pg-core';
import { caseEntity } from './case.schema';
import { post } from './post.schema';
import { localeEnum } from './shared.schema';

// In-house, per docs/planning/02-content-model.md §7 decision. No translation table — user-
// generated, not admin-authored bilingual content; `locale` records which language it was
// written in for admin filtering only.
export const commentStatusEnum = pgEnum('CommentStatus', ['PENDING', 'APPROVED', 'REJECTED', 'SPAM']);

export const comment = pgTable(
  'comment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('postId').references(() => post.id, { onDelete: 'cascade' }),
    caseId: uuid('caseId').references(() => caseEntity.id, { onDelete: 'cascade' }),
    parentCommentId: uuid('parentCommentId').references((): any => comment.id, { onDelete: 'cascade' }),
    authorName: varchar('authorName', { length: 100 }).notNull(),
    // Moderation contact only, never rendered publicly.
    authorEmail: varchar('authorEmail', { length: 255 }),
    authorUrl: varchar('authorUrl', { length: 500 }),
    body: text('body').notNull(),
    status: commentStatusEnum('status').notNull().default('PENDING'),
    locale: localeEnum('locale').notNull(),
    // Hashed, not raw — spam/rate-limit use only.
    ipAddressHash: varchar('ipAddressHash', { length: 64 }),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
  },
  (t) => [
    index('IDX_comment_postId').on(t.postId),
    index('IDX_comment_caseId').on(t.caseId),
    index('IDX_comment_status').on(t.status),
    check('CHK_comment_exactly_one_target', sql`(("postId" IS NOT NULL)::int + ("caseId" IS NOT NULL)::int) = 1`),
  ],
);
