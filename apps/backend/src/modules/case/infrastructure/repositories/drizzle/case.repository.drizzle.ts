import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import {
  caseEntity as caseTable,
  caseTranslation as caseTranslationTable,
  caseTechnology as caseTechnologyTable,
  technology as technologyTable,
} from '@/common/drizzle/schema';
import { buildPaginated, PaginatedResult, toSqlPagination } from '@/common/Paginated';
import { ReorderItemBody } from '@/common/Reorder';
import { ContentStatus } from '@/enums/content-status.enum';
import { TechnologyCategory } from '@/enums/technology-category.enum';
import { Locale } from '@/interfaces/locale.type';
import { Case, CaseTechnologyRef, CaseTranslation } from '../../../domain/entities/case.entity';
import { CaseRepository } from '../../../domain/repositories/case.repository';
import { CreateCaseBody, UpdateCaseBody } from '../../../presentation/dtos/case.dto';

type CaseRow = typeof caseTable.$inferSelect;
type CaseTranslationRow = typeof caseTranslationTable.$inferSelect;

@Injectable()
export class CaseRepositoryDrizzle extends CaseRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findPublished(page: number, perPage: number): Promise<PaginatedResult<Case>> {
    const { limit, offset } = toSqlPagination(page, perPage);
    const condition = and(eq(caseTable.status, ContentStatus.PUBLISHED), isNull(caseTable.deletedAt));
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(caseTable).where(condition).orderBy(asc(caseTable.position)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(caseTable).where(condition),
    ]);
    return buildPaginated(await this.assemble(rows), Number(total), page, perPage);
  }

  async findPublishedBySlug(locale: Locale, slug: string): Promise<Case | null> {
    const rows = await this.db
      .select({ case: caseTable })
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
    if (!rows.length) return null;
    const [assembled] = await this.assemble([rows[0].case]);
    return assembled;
  }

  /** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
  async findBySlug(locale: Locale, slug: string): Promise<Case | null> {
    const rows = await this.db
      .select({ case: caseTable })
      .from(caseTable)
      .innerJoin(caseTranslationTable, eq(caseTranslationTable.caseId, caseTable.id))
      .where(
        and(eq(caseTranslationTable.locale, locale), eq(caseTranslationTable.slug, slug), isNull(caseTable.deletedAt)),
      )
      .limit(1);
    if (!rows.length) return null;
    const [assembled] = await this.assemble([rows[0].case]);
    return assembled;
  }

  async findAllAdmin(page: number, perPage: number): Promise<PaginatedResult<Case>> {
    const condition = isNull(caseTable.deletedAt);
    const { limit, offset } = toSqlPagination(page, perPage);
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(caseTable).where(condition).orderBy(asc(caseTable.position)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(caseTable).where(condition),
    ]);
    return buildPaginated(await this.assemble(rows), Number(total), page, perPage);
  }

  async findById(id: string): Promise<Case | null> {
    const [row] = await this.db
      .select()
      .from(caseTable)
      .where(and(eq(caseTable.id, id), isNull(caseTable.deletedAt)))
      .limit(1);
    if (!row) return null;
    const [assembled] = await this.assemble([row]);
    return assembled;
  }

  async create(body: CreateCaseBody): Promise<Case> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(caseTable)
        .values({
          repoUrl: body.repoUrl,
          liveUrl: body.liveUrl,
          position: body.position ?? 0,
        })
        .returning();

      await tx.insert(caseTranslationTable).values([
        { caseId: row.id, locale: 'ru', ...body.ru },
        { caseId: row.id, locale: 'en', ...body.en },
      ]);

      if (body.technologyIds?.length) {
        await tx
          .insert(caseTechnologyTable)
          .values(body.technologyIds.map((technologyId) => ({ caseId: row.id, technologyId })));
      }

      const [assembled] = await this.assemble([row], tx);
      return assembled;
    });
  }

  async update(id: string, body: UpdateCaseBody): Promise<Case> {
    return this.db.transaction(async (tx) => {
      const wasPublishing = body.status === ContentStatus.PUBLISHED;
      const [existing] = await tx.select().from(caseTable).where(eq(caseTable.id, id)).limit(1);
      if (!existing) throw new NotFoundException(`Case ${id} not found.`);

      const [row] = await tx
        .update(caseTable)
        .set({
          ...(body.status !== undefined && { status: body.status }),
          ...(body.repoUrl !== undefined && { repoUrl: body.repoUrl }),
          ...(body.liveUrl !== undefined && { liveUrl: body.liveUrl }),
          ...(wasPublishing && !existing.publishedAt && { publishedAt: new Date() }),
          updatedAt: new Date(),
        })
        .where(eq(caseTable.id, id))
        .returning();

      for (const locale of ['ru', 'en'] as Locale[]) {
        const translationBody = body[locale];
        if (!translationBody) continue;
        await tx
          .insert(caseTranslationTable)
          .values({ caseId: id, locale, ...translationBody })
          .onConflictDoUpdate({
            target: [caseTranslationTable.caseId, caseTranslationTable.locale],
            set: { ...translationBody },
          });
      }

      if (body.technologyIds) {
        await tx.delete(caseTechnologyTable).where(eq(caseTechnologyTable.caseId, id));
        if (body.technologyIds.length) {
          await tx
            .insert(caseTechnologyTable)
            .values(body.technologyIds.map((technologyId) => ({ caseId: id, technologyId })));
        }
      }

      const [assembled] = await this.assemble([row], tx);
      return assembled;
    });
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .update(caseTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(caseTable.id, id), isNull(caseTable.deletedAt)))
      .returning({ id: caseTable.id });
    if (!rows.length) throw new NotFoundException(`Case ${id} not found.`);
  }

  async reorder(items: ReorderItemBody[]): Promise<void> {
    if (!items.length) return;

    // Single statement instead of N sequential UPDATEs — one round trip regardless of how many
    // items are being reordered, still atomic since it's one statement (no transaction needed).
    const rows = sql.join(
      items.map((item) => sql`(${item.id}::uuid, ${item.position}::int)`),
      sql`, `,
    );
    await this.db.execute(sql`
      UPDATE ${caseTable} AS t
      SET position = v.position
      FROM (VALUES ${rows}) AS v(id, position)
      WHERE t.id = v.id
    `);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(caseTable)
      .set({ viewCount: sql`${caseTable.viewCount} + 1` })
      .where(and(eq(caseTable.id, id), isNull(caseTable.deletedAt)));
  }

  private async assemble(rows: CaseRow[], executor: NodePgDatabase<typeof schema> = this.db): Promise<Case[]> {
    if (!rows.length) return [];
    const caseIds = rows.map((row) => row.id);

    const [translations, techLinks] = await Promise.all([
      executor.select().from(caseTranslationTable).where(inArray(caseTranslationTable.caseId, caseIds)),
      executor
        .select({ caseId: caseTechnologyTable.caseId, technology: technologyTable })
        .from(caseTechnologyTable)
        .innerJoin(technologyTable, eq(technologyTable.id, caseTechnologyTable.technologyId))
        .where(inArray(caseTechnologyTable.caseId, caseIds)),
    ]);

    const translationsByCaseId = new Map<string, CaseTranslationRow[]>();
    for (const t of translations) {
      const list = translationsByCaseId.get(t.caseId) ?? [];
      list.push(t);
      translationsByCaseId.set(t.caseId, list);
    }

    const technologiesByCaseId = new Map<string, CaseTechnologyRef[]>();
    for (const link of techLinks) {
      const list = technologiesByCaseId.get(link.caseId) ?? [];
      list.push({
        id: link.technology.id,
        name: link.technology.name,
        category: link.technology.category as TechnologyCategory,
        iconSlug: link.technology.iconSlug ?? undefined,
      });
      technologiesByCaseId.set(link.caseId, list);
    }

    return rows.map((row) =>
      this.toDomain(row, translationsByCaseId.get(row.id) ?? [], technologiesByCaseId.get(row.id) ?? []),
    );
  }

  private toDomain(row: CaseRow, translations: CaseTranslationRow[], technologies: CaseTechnologyRef[]): Case {
    const translationsRecord: Partial<Record<Locale, CaseTranslation>> = {};
    for (const t of translations) {
      translationsRecord[t.locale] = {
        locale: t.locale,
        title: t.title,
        slug: t.slug,
        summary: t.summary,
        body: t.body,
        seoTitle: t.seoTitle ?? undefined,
        seoDescription: t.seoDescription ?? undefined,
      };
    }
    return new Case({
      id: row.id,
      status: row.status as ContentStatus,
      publishedAt: row.publishedAt ?? undefined,
      position: row.position,
      repoUrl: row.repoUrl ?? undefined,
      liveUrl: row.liveUrl ?? undefined,
      viewCount: row.viewCount,
      technologies,
      translations: translationsRecord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
