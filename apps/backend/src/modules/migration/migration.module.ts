import { Module, OnModuleInit } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { CaptchaRepository } from '../captcha/domain/repositories/captcha.repository';
import { CaptchaRepositoryDrizzle } from '../captcha/infrastructure/repositories/captcha.repository.drizzle';
import { MigrationService } from './migration.service';
import { UserSeedService } from './user-seed.service';
import { RolesSeedService } from './roles-seed.service';
import { NotificationTemplateSeedService } from './notification-template-seed.service';
import { HeroSeedService } from './hero-seed.service';
import { AboutSeedService } from './about-seed.service';
import { SiteSettingSeedService } from './site-setting-seed.service';
import { CaptchaTemplateSeedService } from './captcha-template-seed.service';
import { TemplateSeedService } from '../mail/infrastructure/services/template-seed.service';

@Module({
  imports: [UsersModule, MailModule],
  providers: [
    MigrationService,
    UserSeedService,
    RolesSeedService,
    NotificationTemplateSeedService,
    HeroSeedService,
    AboutSeedService,
    SiteSettingSeedService,
    CaptchaTemplateSeedService,
    { provide: CaptchaRepository, useClass: CaptchaRepositoryDrizzle },
  ],
})
export class MigrationModule implements OnModuleInit {
  constructor(
    private readonly migrationService: MigrationService,
    private readonly templateSeedService: TemplateSeedService,
  ) {}

  async onModuleInit() {
    await this.migrationService.migrateAndSeed();
    await this.templateSeedService.seedTemplates();
  }
}
