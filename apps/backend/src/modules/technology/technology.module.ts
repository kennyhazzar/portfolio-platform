import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TechnologyCommandHandlers, TechnologyQueryHandlers } from './application/handlers/technology.handlers';
import { TechnologyRepository } from './domain/repositories/technology.repository';
import { TechnologyRepositoryDrizzle } from './infrastructure/repositories/drizzle/technology.repository.drizzle';
import { TechnologyController } from './presentation/controllers/technology.controller';
import { TechnologyAdminController } from './presentation/controllers/technology-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [TechnologyController, TechnologyAdminController],
  providers: [
    ...TechnologyCommandHandlers,
    ...TechnologyQueryHandlers,
    { provide: TechnologyRepository, useClass: TechnologyRepositoryDrizzle },
  ],
})
export class TechnologyModule {}
