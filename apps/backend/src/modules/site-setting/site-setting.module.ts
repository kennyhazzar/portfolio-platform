import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SiteSettingGetHandler } from './application/handlers/site-setting-get.handler';
import { SiteSettingUpdateHandler } from './application/handlers/site-setting-update.handler';
import { SiteSettingRepository } from './domain/repositories/site-setting.repository';
import { SiteSettingRepositoryDrizzle } from './infrastructure/repositories/drizzle/site-setting.repository.drizzle';
import { SiteSettingController } from './presentation/controllers/site-setting.controller';
import { SiteSettingAdminController } from './presentation/controllers/site-setting-admin.controller';
import { UsersModule } from '../users/users.module';

const CommandHandlers = [SiteSettingUpdateHandler];
const QueryHandlers = [SiteSettingGetHandler];

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [SiteSettingController, SiteSettingAdminController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: SiteSettingRepository, useClass: SiteSettingRepositoryDrizzle },
  ],
})
export class SiteSettingModule {}
