import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import {
  NavigationItemCommandHandlers,
  NavigationItemQueryHandlers,
} from './application/handlers/navigation-item.handlers';
import { NavigationItemRepository } from './domain/repositories/navigation-item.repository';
import { NavigationItemRepositoryDrizzle } from './infrastructure/repositories/drizzle/navigation-item.repository.drizzle';
import { NavigationItemController } from './presentation/controllers/navigation-item.controller';
import { NavigationItemAdminController } from './presentation/controllers/navigation-item-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [NavigationItemController, NavigationItemAdminController],
  providers: [
    ...NavigationItemCommandHandlers,
    ...NavigationItemQueryHandlers,
    { provide: NavigationItemRepository, useClass: NavigationItemRepositoryDrizzle },
  ],
})
export class NavigationModule {}
