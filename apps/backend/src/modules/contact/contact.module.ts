import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ContactCommandHandlers, ContactQueryHandlers } from './application/handlers/contact.handlers';
import { ContactRepository } from './domain/repositories/contact.repository';
import { ContactRepositoryDrizzle } from './infrastructure/repositories/drizzle/contact.repository.drizzle';
import { ContactController } from './presentation/controllers/contact.controller';
import { ContactAdminController } from './presentation/controllers/contact-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [ContactController, ContactAdminController],
  providers: [
    ...ContactCommandHandlers,
    ...ContactQueryHandlers,
    { provide: ContactRepository, useClass: ContactRepositoryDrizzle },
  ],
})
export class ContactModule {}
