import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import { about as aboutTable, aboutTranslation as aboutTranslationTable } from '@/common/drizzle/schema';
import { LOCALES, Locale } from '@/interfaces/locale.type';
import { About, AboutTranslation } from '../../../domain/entities/about.entity';
import { AboutRepository } from '../../../domain/repositories/about.repository';
import { UpdateAboutBody } from '../../../presentation/dtos/about.dto';

type AboutRow = typeof aboutTable.$inferSelect;
type AboutTranslationRow = typeof aboutTranslationTable.$inferSelect;

@Injectable()
export class AboutRepositoryDrizzle extends AboutRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async get(): Promise<About | null> {
    const [row] = await this.db.select().from(aboutTable).limit(1);
    if (!row) return null;
    const translations = await this.db
      .select()
      .from(aboutTranslationTable)
      .where(eq(aboutTranslationTable.aboutId, row.id));
    return this.toDomain(row, translations);
  }

  async update(update: UpdateAboutBody): Promise<About> {
    const [existing] = await this.db.select().from(aboutTable).limit(1);
    if (!existing) {
      throw new NotFoundException('About singleton row is missing — the foundation seed did not run.');
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(aboutTable)
        .set({ updatedAt: new Date() })
        .where(eq(aboutTable.id, existing.id))
        .returning();

      for (const locale of LOCALES) {
        const body = update[locale];
        await tx
          .insert(aboutTranslationTable)
          .values({ aboutId: existing.id, locale, ...body })
          .onConflictDoUpdate({
            target: [aboutTranslationTable.aboutId, aboutTranslationTable.locale],
            set: { ...body },
          });
      }

      const translations = await tx
        .select()
        .from(aboutTranslationTable)
        .where(eq(aboutTranslationTable.aboutId, existing.id));
      return this.toDomain(updated, translations);
    });
  }

  private toDomain(row: AboutRow, translations: AboutTranslationRow[]): About {
    const translationsRecord: Partial<Record<Locale, AboutTranslation>> = {};
    for (const t of translations) {
      translationsRecord[t.locale] = { locale: t.locale, bio: t.bio };
    }
    return new About({
      id: row.id,
      translations: translationsRecord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
