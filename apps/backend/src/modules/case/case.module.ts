import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ViewTrackingModule } from '@/common/view-tracking/view-tracking.module';
import { CaseCommandHandlers, CaseQueryHandlers } from './application/handlers/case.handlers';
import { CaseRepository } from './domain/repositories/case.repository';
import { CaseRepositoryDrizzle } from './infrastructure/repositories/drizzle/case.repository.drizzle';
import { CaseController } from './presentation/controllers/case.controller';
import { CaseAdminController } from './presentation/controllers/case-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule, ViewTrackingModule],
  controllers: [CaseController, CaseAdminController],
  providers: [
    ...CaseCommandHandlers,
    ...CaseQueryHandlers,
    { provide: CaseRepository, useClass: CaseRepositoryDrizzle },
  ],
})
export class CaseModule {}
