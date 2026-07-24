import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import { hero, heroTranslation } from '@/common/drizzle/schema';
import * as schema from '@/common/drizzle/schema';

/**
 * Seeds the singleton hero row so the admin panel always has something to edit
 * and the public endpoint never 404s on a fresh install. Placeholder copy is
 * meant to be replaced via the admin panel, not curated here.
 */
@Injectable()
export class HeroSeedService {
  private readonly logger = new Logger(HeroSeedService.name);

  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async seedIfEmpty(): Promise<void> {
    const [existing] = await this.db.select({ id: hero.id }).from(hero).limit(1);
    if (existing) return;

    const [row] = await this.db.insert(hero).values({}).returning();
    await this.db.insert(heroTranslation).values([
      {
        heroId: row.id,
        locale: 'ru',
        name: 'Ваше имя',
        headline: 'Backend/fullstack-инженер',
        description: 'Отредактируйте этот текст в админ-панели.',
        ctaLabel: 'Смотреть кейсы',
      },
      {
        heroId: row.id,
        locale: 'en',
        name: 'Your Name',
        headline: 'Backend/fullstack engineer',
        description: 'Edit this copy from the admin panel.',
        ctaLabel: 'View case studies',
      },
    ]);
    this.logger.log('Seeded singleton hero row with placeholder content');
  }
}
