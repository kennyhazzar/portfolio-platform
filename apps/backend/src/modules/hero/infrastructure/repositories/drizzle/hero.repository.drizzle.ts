import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import * as schema from '@/common/drizzle/schema';
import { hero as heroTable, heroTranslation as heroTranslationTable } from '@/common/drizzle/schema';
import { LOCALES, Locale } from '@/interfaces/locale.type';
import { Hero, HeroTranslation } from '../../../domain/entities/hero.entity';
import { HeroRepository } from '../../../domain/repositories/hero.repository';
import { UpdateHeroBody } from '../../../presentation/dtos/hero.dto';

type HeroRow = typeof heroTable.$inferSelect;
type HeroTranslationRow = typeof heroTranslationTable.$inferSelect;

@Injectable()
export class HeroRepositoryDrizzle extends HeroRepository {
  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async get(): Promise<Hero | null> {
    const [row] = await this.db.select().from(heroTable).limit(1);
    if (!row) return null;
    const translations = await this.db
      .select()
      .from(heroTranslationTable)
      .where(eq(heroTranslationTable.heroId, row.id));
    return this.toDomain(row, translations);
  }

  async update(update: UpdateHeroBody): Promise<Hero> {
    const [existing] = await this.db.select().from(heroTable).limit(1);
    if (!existing) {
      throw new NotFoundException('Hero singleton row is missing — the foundation seed did not run.');
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(heroTable)
        .set({ ctaUrl: update.ctaUrl, updatedAt: new Date() })
        .where(eq(heroTable.id, existing.id))
        .returning();

      for (const locale of LOCALES) {
        const body = update[locale];
        await tx
          .insert(heroTranslationTable)
          .values({ heroId: existing.id, locale, ...body })
          .onConflictDoUpdate({
            target: [heroTranslationTable.heroId, heroTranslationTable.locale],
            set: { ...body },
          });
      }

      const translations = await tx
        .select()
        .from(heroTranslationTable)
        .where(eq(heroTranslationTable.heroId, existing.id));
      return this.toDomain(updated, translations);
    });
  }

  private toDomain(row: HeroRow, translations: HeroTranslationRow[]): Hero {
    const translationsRecord: Partial<Record<Locale, HeroTranslation>> = {};
    for (const t of translations) {
      translationsRecord[t.locale] = {
        locale: t.locale,
        name: t.name,
        headline: t.headline ?? undefined,
        description: t.description ?? undefined,
        ctaLabel: t.ctaLabel ?? undefined,
      };
    }
    return new Hero({
      id: row.id,
      ctaUrl: row.ctaUrl ?? undefined,
      translations: translationsRecord,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
