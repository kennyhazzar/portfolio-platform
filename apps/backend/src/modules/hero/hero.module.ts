import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { HeroGetHandler } from './application/handlers/hero-get.handler';
import { HeroUpdateHandler } from './application/handlers/hero-update.handler';
import { HeroRepository } from './domain/repositories/hero.repository';
import { HeroRepositoryDrizzle } from './infrastructure/repositories/drizzle/hero.repository.drizzle';
import { HeroController } from './presentation/controllers/hero.controller';
import { HeroAdminController } from './presentation/controllers/hero-admin.controller';
import { UsersModule } from '../users/users.module';

const CommandHandlers = [HeroUpdateHandler];
const QueryHandlers = [HeroGetHandler];

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [HeroController, HeroAdminController],
  providers: [...CommandHandlers, ...QueryHandlers, { provide: HeroRepository, useClass: HeroRepositoryDrizzle }],
})
export class HeroModule {}
