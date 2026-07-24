import { Injectable, Logger } from '@nestjs/common';

import { PoliciesService } from '@/modules/users/infrastructure/services/policies.service';
import { UserSeedService } from './user-seed.service';
import { NotificationTemplateSeedService } from './notification-template-seed.service';
import { HeroSeedService } from './hero-seed.service';
import { AboutSeedService } from './about-seed.service';
import { SiteSettingSeedService } from './site-setting-seed.service';
import { CaptchaTemplateSeedService } from './captcha-template-seed.service';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    private readonly userSeedService: UserSeedService,
    private readonly notificationTemplateSeedService: NotificationTemplateSeedService,
    private readonly heroSeedService: HeroSeedService,
    private readonly aboutSeedService: AboutSeedService,
    private readonly siteSettingSeedService: SiteSettingSeedService,
    private readonly captchaTemplateSeedService: CaptchaTemplateSeedService,
    private readonly policiesService: PoliciesService,
  ) {}

  async migrateAndSeed() {
    this.logger.log('Starting migration and seeding...');

    // Seed users and roles
    await this.userSeedService.seedIfEmpty();
    await this.policiesService.refreshAllAbilities();

    // Seed notification templates
    await this.seedNotificationTemplates();

    // Seed singleton content rows
    await this.heroSeedService.seedIfEmpty();
    await this.aboutSeedService.seedIfEmpty();
    await this.siteSettingSeedService.seedIfEmpty();

    // Seed the default captcha template so the public comment form works out of the box
    await this.captchaTemplateSeedService.seedIfEmpty();

    this.logger.log('Migration and seeding completed successfully');
  }

  private async seedNotificationTemplates() {
    this.logger.debug('Seeding notification templates...');
    await this.notificationTemplateSeedService.seedIfEmpty();
  }
}
