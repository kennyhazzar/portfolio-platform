import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CommentCommandHandlers, CommentQueryHandlers } from './application/handlers/comment.handlers';
import { CommentRepository } from './domain/repositories/comment.repository';
import { CommentRepositoryDrizzle } from './infrastructure/repositories/drizzle/comment.repository.drizzle';
import { CommentController } from './presentation/controllers/comment.controller';
import { CommentAdminController } from './presentation/controllers/comment-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [CommentController, CommentAdminController],
  providers: [
    ...CommentCommandHandlers,
    ...CommentQueryHandlers,
    { provide: CommentRepository, useClass: CommentRepositoryDrizzle },
  ],
})
export class CommentModule {}
