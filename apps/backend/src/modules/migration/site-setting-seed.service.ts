import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_CONNECTION } from '@/common/drizzle/drizzle.provider';
import { siteSetting, siteSettingTranslation } from '@/common/drizzle/schema';
import * as schema from '@/common/drizzle/schema';

/** Seeds the singleton site_setting row, same rationale as HeroSeedService. */
@Injectable()
export class SiteSettingSeedService {
  private readonly logger = new Logger(SiteSettingSeedService.name);

  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async seedIfEmpty(): Promise<void> {
    const [existing] = await this.db.select({ id: siteSetting.id }).from(siteSetting).limit(1);
    if (existing) return;

    const [row] = await this.db.insert(siteSetting).values({}).returning();
    await this.db.insert(siteSettingTranslation).values([
      {
        siteSettingId: row.id,
        locale: 'ru',
        title: 'Портфолио',
        description: 'Личный сайт backend/fullstack-инженера.',
      },
      {
        siteSettingId: row.id,
        locale: 'en',
        title: 'Portfolio',
        description: 'Personal site of a backend/fullstack engineer.',
      },
    ]);
    this.logger.log('Seeded singleton site_setting row with placeholder content');
  }
}
