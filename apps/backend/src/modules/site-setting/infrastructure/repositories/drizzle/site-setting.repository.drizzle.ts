import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import {
  siteSetting as siteSettingTable,
  siteSettingTranslation as siteSettingTranslationTable,
} from '@/common/drizzle/schema';
import { LOCALES, Locale } from '@/interfaces/locale.type';
import { SiteSetting, SiteSettingTranslation } from '../../../domain/entities/site-setting.entity';
import { SiteSettingRepository } from '../../../domain/repositories/site-setting.repository';
import { UpdateSiteSettingBody } from '../../../presentation/dtos/site-setting.dto';

type SiteSettingRow = typeof siteSettingTable.$inferSelect;
type SiteSettingTranslationRow = typeof siteSettingTranslationTable.$inferSelect;

@Injectable()
export class SiteSettingRepositoryDrizzle extends SiteSettingRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async get(): Promise<SiteSetting | null> {
    const [row] = await this.db.select().from(siteSettingTable).limit(1);
    if (!row) return null;
    const translations = await this.db
      .select()
      .from(siteSettingTranslationTable)
      .where(eq(siteSettingTranslationTable.siteSettingId, row.id));
    return this.toDomain(row, translations);
  }

  async update(update: UpdateSiteSettingBody): Promise<SiteSetting> {
    const [existing] = await this.db.select().from(siteSettingTable).limit(1);
    if (!existing) {
      throw new NotFoundException('Site setting singleton row is missing — the foundation seed did not run.');
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(siteSettingTable)
        .set({ updatedAt: new Date() })
        .where(eq(siteSettingTable.id, existing.id))
        .returning();

      for (const locale of LOCALES) {
        const body = update[locale];
        await tx
          .insert(siteSettingTranslationTable)
          .values({ siteSettingId: existing.id, locale, ...body })
          .onConflictDoUpdate({
            target: [siteSettingTranslationTable.siteSettingId, siteSettingTranslationTable.locale],
            set: { ...body },
          });
      }

      const translations = await tx
        .select()
        .from(siteSettingTranslationTable)
        .where(eq(siteSettingTranslationTable.siteSettingId, existing.id));
      return this.toDomain(updated, translations);
    });
  }

  private toDomain(row: SiteSettingRow, translations: SiteSettingTranslationRow[]): SiteSetting {
    const translationsRecord: Partial<Record<Locale, SiteSettingTranslation>> = {};
    for (const t of translations) {
      translationsRecord[t.locale] = {
        locale: t.locale,
        title: t.title,
        brandName: t.brandName ?? undefined,
        description: t.description,
        footerText: t.footerText ?? undefined,
        copyrightText: t.copyrightText ?? undefined,
        defaultSeoTitle: t.defaultSeoTitle ?? undefined,
        defaultSeoDescription: t.defaultSeoDescription ?? undefined,
      };
    }
    return new SiteSetting({
      id: row.id,
      translations: translationsRecord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
