import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import { post as postTable } from '@/common/drizzle/schema';
import { buildPaginated, PaginatedResult, toSqlPagination } from '@/common/Paginated';
import { ContentStatus } from '@/enums/content-status.enum';
import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { Post } from '../../../domain/entities/post.entity';
import { PostRepository } from '../../../domain/repositories/post.repository';
import { CreatePostBody, UpdatePostBody } from '../../../presentation/dtos/post.dto';

type PostRow = typeof postTable.$inferSelect;

@Injectable()
export class PostRepositoryDrizzle extends PostRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findPublished(locale: Locale, page: number, perPage: number): Promise<PaginatedResult<Post>> {
    const { limit, offset } = toSqlPagination(page, perPage);
    const condition = and(
      eq(postTable.locale, locale),
      eq(postTable.status, ContentStatus.PUBLISHED),
      isNull(postTable.deletedAt),
    );
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(postTable)
        .where(condition)
        .orderBy(desc(postTable.publishedAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(postTable).where(condition),
    ]);
    return buildPaginated(
      rows.map((row) => this.toDomain(row)),
      Number(total),
      page,
      perPage,
    );
  }

  async findPublishedBySlug(locale: Locale, slug: string): Promise<Post | null> {
    const [row] = await this.db
      .select()
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
    return row ? this.toDomain(row) : null;
  }

  /** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
  async findBySlug(locale: Locale, slug: string): Promise<Post | null> {
    const [row] = await this.db
      .select()
      .from(postTable)
      .where(and(eq(postTable.locale, locale), eq(postTable.slug, slug), isNull(postTable.deletedAt)))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findAllAdmin(page: number, perPage: number): Promise<PaginatedResult<Post>> {
    const condition = isNull(postTable.deletedAt);
    const { limit, offset } = toSqlPagination(page, perPage);
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(postTable).where(condition).orderBy(desc(postTable.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(postTable).where(condition),
    ]);
    return buildPaginated(
      rows.map((row) => this.toDomain(row)),
      Number(total),
      page,
      perPage,
    );
  }

  async findById(id: string): Promise<Post | null> {
    const [row] = await this.db
      .select()
      .from(postTable)
      .where(and(eq(postTable.id, id), isNull(postTable.deletedAt)))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(authorUserId: IdType, body: CreatePostBody): Promise<Post> {
    const [row] = await this.db
      .insert(postTable)
      .values({
        authorUserId,
        locale: body.locale,
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        body: body.body,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, body: UpdatePostBody): Promise<Post> {
    const wasPublishing = body.status === ContentStatus.PUBLISHED;
    const [existing] = await this.db.select().from(postTable).where(eq(postTable.id, id)).limit(1);
    if (!existing) throw new NotFoundException(`Post ${id} not found.`);

    const [row] = await this.db
      .update(postTable)
      .set({
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
        ...(wasPublishing && !existing.publishedAt && { publishedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(postTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .update(postTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(postTable.id, id), isNull(postTable.deletedAt)))
      .returning({ id: postTable.id });
    if (!rows.length) throw new NotFoundException(`Post ${id} not found.`);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(postTable)
      .set({ viewCount: sql`${postTable.viewCount} + 1` })
      .where(and(eq(postTable.id, id), isNull(postTable.deletedAt)));
  }

  private toDomain(row: PostRow): Post {
    return new Post({
      id: row.id,
      authorUserId: row.authorUserId,
      status: row.status as ContentStatus,
      publishedAt: row.publishedAt ?? undefined,
      viewCount: row.viewCount,
      locale: row.locale,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      seoTitle: row.seoTitle ?? undefined,
      seoDescription: row.seoDescription ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
