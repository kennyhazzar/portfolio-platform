import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AboutGetHandler } from './application/handlers/about-get.handler';
import { AboutUpdateHandler } from './application/handlers/about-update.handler';
import { AboutRepository } from './domain/repositories/about.repository';
import { AboutRepositoryDrizzle } from './infrastructure/repositories/drizzle/about.repository.drizzle';
import { AboutController } from './presentation/controllers/about.controller';
import { AboutAdminController } from './presentation/controllers/about-admin.controller';
import { UsersModule } from '../users/users.module';

const CommandHandlers = [AboutUpdateHandler];
const QueryHandlers = [AboutGetHandler];

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [AboutController, AboutAdminController],
  providers: [...CommandHandlers, ...QueryHandlers, { provide: AboutRepository, useClass: AboutRepositoryDrizzle }],
})
export class AboutModule {}
