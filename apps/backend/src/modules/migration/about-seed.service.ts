import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import { about, aboutTranslation } from '@/common/drizzle/schema';
import * as schema from '@/common/drizzle/schema';

/** Seeds the singleton about row, same rationale as HeroSeedService. */
@Injectable()
export class AboutSeedService {
  private readonly logger = new Logger(AboutSeedService.name);

  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async seedIfEmpty(): Promise<void> {
    const [existing] = await this.db.select({ id: about.id }).from(about).limit(1);
    if (existing) return;

    const [row] = await this.db.insert(about).values({}).returning();
    await this.db.insert(aboutTranslation).values([
      { aboutId: row.id, locale: 'ru', bio: 'Отредактируйте этот текст в админ-панели.' },
      { aboutId: row.id, locale: 'en', bio: 'Edit this copy from the admin panel.' },
    ]);
    this.logger.log('Seeded singleton about row with placeholder content');
  }
}
