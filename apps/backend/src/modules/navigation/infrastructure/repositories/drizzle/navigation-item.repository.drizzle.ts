import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import {
  navigationItem as navigationItemTable,
  navigationItemTranslation as navigationItemTranslationTable,
} from '@/common/drizzle/schema';
import { ReorderItemBody } from '@/common/Reorder';
import { LOCALES, Locale } from '@/interfaces/locale.type';
import { NavigationItem, NavigationItemTranslation } from '../../../domain/entities/navigation-item.entity';
import { NavigationItemRepository } from '../../../domain/repositories/navigation-item.repository';
import { CreateNavigationItemBody, UpdateNavigationItemBody } from '../../../presentation/dtos/navigation-item.dto';

type NavigationItemRow = typeof navigationItemTable.$inferSelect;
type NavigationItemTranslationRow = typeof navigationItemTranslationTable.$inferSelect;

@Injectable()
export class NavigationItemRepositoryDrizzle extends NavigationItemRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async findAll(visibleOnly: boolean): Promise<NavigationItem[]> {
    const rows = visibleOnly
      ? await this.db
          .select()
          .from(navigationItemTable)
          .where(eq(navigationItemTable.isVisible, true))
          .orderBy(asc(navigationItemTable.position))
      : await this.db.select().from(navigationItemTable).orderBy(asc(navigationItemTable.position));

    const translations = await this.db.select().from(navigationItemTranslationTable);
    const byItemId = this.groupTranslations(translations);
    return rows.map((row) => this.toDomain(row, byItemId.get(row.id) ?? []));
  }

  async findById(id: string): Promise<NavigationItem | null> {
    const [row] = await this.db.select().from(navigationItemTable).where(eq(navigationItemTable.id, id)).limit(1);
    if (!row) return null;
    const translations = await this.db
      .select()
      .from(navigationItemTranslationTable)
      .where(eq(navigationItemTranslationTable.navigationItemId, id));
    return this.toDomain(row, translations);
  }

  async create(body: CreateNavigationItemBody): Promise<NavigationItem> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(navigationItemTable)
        .values({
          parentId: body.parentId,
          url: body.url,
          position: body.position ?? 0,
          isVisible: body.isVisible ?? true,
        })
        .returning();

      await tx.insert(navigationItemTranslationTable).values([
        { navigationItemId: row.id, locale: 'ru', label: body.ru.label },
        { navigationItemId: row.id, locale: 'en', label: body.en.label },
      ]);

      const translations = await tx
        .select()
        .from(navigationItemTranslationTable)
        .where(eq(navigationItemTranslationTable.navigationItemId, row.id));
      return this.toDomain(row, translations);
    });
  }

  async update(id: string, body: UpdateNavigationItemBody): Promise<NavigationItem> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(navigationItemTable)
        .set({
          ...(body.parentId !== undefined && { parentId: body.parentId }),
          ...(body.url !== undefined && { url: body.url }),
          ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
          updatedAt: new Date(),
        })
        .where(eq(navigationItemTable.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Navigation item ${id} not found.`);

      for (const locale of LOCALES) {
        const translationBody = body[locale];
        if (!translationBody) continue;
        await tx
          .insert(navigationItemTranslationTable)
          .values({ navigationItemId: id, locale, label: translationBody.label })
          .onConflictDoUpdate({
            target: [navigationItemTranslationTable.navigationItemId, navigationItemTranslationTable.locale],
            set: { label: translationBody.label },
          });
      }

      const translations = await tx
        .select()
        .from(navigationItemTranslationTable)
        .where(eq(navigationItemTranslationTable.navigationItemId, id));
      return this.toDomain(row, translations);
    });
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .delete(navigationItemTable)
      .where(eq(navigationItemTable.id, id))
      .returning({ id: navigationItemTable.id });
    if (!rows.length) throw new NotFoundException(`Navigation item ${id} not found.`);
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
      UPDATE ${navigationItemTable} AS t
      SET position = v.position
      FROM (VALUES ${rows}) AS v(id, position)
      WHERE t.id = v.id
    `);
  }

  private groupTranslations(rows: NavigationItemTranslationRow[]): Map<string, NavigationItemTranslationRow[]> {
    const map = new Map<string, NavigationItemTranslationRow[]>();
    for (const row of rows) {
      const list = map.get(row.navigationItemId) ?? [];
      list.push(row);
      map.set(row.navigationItemId, list);
    }
    return map;
  }

  private toDomain(row: NavigationItemRow, translations: NavigationItemTranslationRow[]): NavigationItem {
    const translationsRecord: Partial<Record<Locale, NavigationItemTranslation>> = {};
    for (const t of translations) {
      translationsRecord[t.locale] = { locale: t.locale, label: t.label };
    }
    return new NavigationItem({
      id: row.id,
      parentId: row.parentId ?? undefined,
      url: row.url,
      position: row.position,
      isVisible: row.isVisible,
      translations: translationsRecord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
