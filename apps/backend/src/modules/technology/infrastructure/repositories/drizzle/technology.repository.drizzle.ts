import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import { technology as technologyTable } from '@/common/drizzle/schema';
import { buildPaginated, PaginatedResult, toSqlPagination } from '@/common/Paginated';
import { ReorderItemBody } from '@/common/Reorder';
import { TechnologyCategory } from '@/enums/technology-category.enum';
import { Technology } from '../../../domain/entities/technology.entity';
import { TechnologyRepository } from '../../../domain/repositories/technology.repository';
import { CreateTechnologyBody, UpdateTechnologyBody } from '../../../presentation/dtos/technology.dto';

type TechnologyRow = typeof technologyTable.$inferSelect;

@Injectable()
export class TechnologyRepositoryDrizzle extends TechnologyRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findAll(page: number, perPage: number): Promise<PaginatedResult<Technology>> {
    const { limit, offset } = toSqlPagination(page, perPage);
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(technologyTable).orderBy(asc(technologyTable.position)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(technologyTable),
    ]);
    return buildPaginated(
      rows.map((row) => this.toDomain(row)),
      Number(total),
      page,
      perPage,
    );
  }

  async findById(id: string): Promise<Technology | null> {
    const [row] = await this.db.select().from(technologyTable).where(eq(technologyTable.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async create(body: CreateTechnologyBody): Promise<Technology> {
    const [row] = await this.db
      .insert(technologyTable)
      .values({
        name: body.name,
        category: body.category ?? TechnologyCategory.OTHER,
        iconSlug: body.iconSlug,
        position: body.position ?? 0,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, body: UpdateTechnologyBody): Promise<Technology> {
    const [row] = await this.db
      .update(technologyTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(technologyTable.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Technology ${id} not found.`);
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .delete(technologyTable)
      .where(eq(technologyTable.id, id))
      .returning({ id: technologyTable.id });
    if (!rows.length) throw new NotFoundException(`Technology ${id} not found.`);
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
      UPDATE ${technologyTable} AS t
      SET position = v.position
      FROM (VALUES ${rows}) AS v(id, position)
      WHERE t.id = v.id
    `);
  }

  private toDomain(row: TechnologyRow): Technology {
    return new Technology({
      id: row.id,
      name: row.name,
      category: row.category as TechnologyCategory,
      iconSlug: row.iconSlug ?? undefined,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
