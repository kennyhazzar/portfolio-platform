import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ViewTrackingModule } from '@/common/view-tracking/view-tracking.module';
import { PostCommandHandlers, PostQueryHandlers } from './application/handlers/post.handlers';
import { PostRepository } from './domain/repositories/post.repository';
import { PostRepositoryDrizzle } from './infrastructure/repositories/drizzle/post.repository.drizzle';
import { PostController } from './presentation/controllers/post.controller';
import { PostAdminController } from './presentation/controllers/post-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CqrsModule, UsersModule, ViewTrackingModule],
  controllers: [PostController, PostAdminController],
  providers: [
    ...PostCommandHandlers,
    ...PostQueryHandlers,
    { provide: PostRepository, useClass: PostRepositoryDrizzle },
  ],
})
export class PostModule {}
