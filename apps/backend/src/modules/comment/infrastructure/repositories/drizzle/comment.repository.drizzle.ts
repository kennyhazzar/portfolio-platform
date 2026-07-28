import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import {
  caseEntity as caseTable,
  caseTranslation as caseTranslationTable,
  comment as commentTable,
  post as postTable,
} from '@/common/drizzle/schema';
import { buildPaginated, PaginatedResult, toSqlPagination } from '@/common/Paginated';
import { CommentStatus } from '@/enums/comment-status.enum';
import { ContentStatus } from '@/enums/content-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { CommentTargetType } from '../../../domain/comment-target.type';
import { Comment } from '../../../domain/entities/comment.entity';
import { CommentRepository } from '../../../domain/repositories/comment.repository';
import { CreateCommentBody } from '../../../presentation/dtos/comment.dto';

type CommentRow = typeof commentTable.$inferSelect;

@Injectable()
export class CommentRepositoryDrizzle extends CommentRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findApprovedBySlug(
    targetType: CommentTargetType,
    locale: Locale,
    slug: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Comment>> {
    const targetId = await this.resolvePublishedTargetId(targetType, locale, slug);
    if (!targetId) return buildPaginated([], 0, page, perPage);
    const targetColumn = targetType === 'post' ? commentTable.postId : commentTable.caseId;

    const condition = and(
      eq(targetColumn, targetId),
      eq(commentTable.status, CommentStatus.APPROVED),
      isNull(commentTable.deletedAt),
    );
    const { limit, offset } = toSqlPagination(page, perPage);
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(commentTable)
        .where(condition)
        .orderBy(desc(commentTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(commentTable).where(condition),
    ]);
    return buildPaginated(
      rows.map((row) => this.toDomain(row)),
      Number(total),
      page,
      perPage,
    );
  }

  async findAllAdmin(
    status: CommentStatus | undefined,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Comment>> {
    const condition = status
      ? and(eq(commentTable.status, status), isNull(commentTable.deletedAt))
      : isNull(commentTable.deletedAt);
    const { limit, offset } = toSqlPagination(page, perPage);
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(commentTable)
        .where(condition)
        .orderBy(desc(commentTable.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(commentTable).where(condition),
    ]);
    return buildPaginated(
      rows.map((row) => this.toDomain(row)),
      Number(total),
      page,
      perPage,
    );
  }

  async findById(id: string): Promise<Comment | null> {
    const [row] = await this.db
      .select()
      .from(commentTable)
      .where(and(eq(commentTable.id, id), isNull(commentTable.deletedAt)))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async createForSlug(
    targetType: CommentTargetType,
    locale: Locale,
    slug: string,
    body: CreateCommentBody,
    ipAddressHash?: string,
    initialStatus?: CommentStatus,
  ): Promise<Comment> {
    const targetId = await this.resolvePublishedTargetId(targetType, locale, slug);
    if (!targetId) throw new NotFoundException(`${targetType === 'post' ? 'Post' : 'Case'} ${slug} not found.`);

    const [row] = await this.db
      .insert(commentTable)
      .values({
        ...(targetType === 'post' ? { postId: targetId } : { caseId: targetId }),
        parentCommentId: body.parentCommentId,
        authorName: body.authorName,
        authorEmail: body.authorEmail,
        authorUrl: body.authorUrl,
        body: body.body,
        locale,
        ipAddressHash,
        ...(initialStatus && { status: initialStatus }),
      })
      .returning();
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: CommentStatus): Promise<Comment> {
    const [row] = await this.db
      .update(commentTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(commentTable.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Comment ${id} not found.`);
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .update(commentTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(commentTable.id, id), isNull(commentTable.deletedAt)))
      .returning({ id: commentTable.id });
    if (!rows.length) throw new NotFoundException(`Comment ${id} not found.`);
  }

  private async resolvePublishedTargetId(
    targetType: CommentTargetType,
    locale: Locale,
    slug: string,
  ): Promise<string | null> {
    if (targetType === 'case') return this.resolvePublishedCaseId(locale, slug);
    return this.resolvePublishedPostId(locale, slug);
  }

  private async resolvePublishedPostId(locale: Locale, slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: postTable.id })
      .from(postTable)
      .where(
        and(
          eq(postTable.locale, locale),
          eq(postTable.slug, slug),
          eq(postTable.status, ContentStatus.PUBLISHED),
          isNull(postTable.deletedAt),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  }

  private async resolvePublishedCaseId(locale: Locale, slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: caseTable.id })
      .from(caseTable)
      .innerJoin(caseTranslationTable, eq(caseTranslationTable.caseId, caseTable.id))
      .where(
        and(
          eq(caseTranslationTable.locale, locale),
          eq(caseTranslationTable.slug, slug),
          eq(caseTable.status, ContentStatus.PUBLISHED),
          isNull(caseTable.deletedAt),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  }

  private toDomain(row: CommentRow): Comment {
    return new Comment({
      id: row.id,
      postId: row.postId ?? undefined,
      caseId: row.caseId ?? undefined,
      parentCommentId: row.parentCommentId ?? undefined,
      authorName: row.authorName,
      authorEmail: row.authorEmail ?? undefined,
      authorUrl: row.authorUrl ?? undefined,
      body: row.body,
      status: row.status as CommentStatus,
      locale: row.locale,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
