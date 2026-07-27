import { createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { ViewTrackingService } from '@/common/view-tracking/view-tracking.service';
import { FileRepository } from '@/modules/file/domain/repositories';
import { Post } from '../../domain/entities/post.entity';
import { PostRepository } from '../../domain/repositories/post.repository';
import {
  PostCreateCommand,
  PostDeleteCommand,
  PostsImportCommand,
  PostRecordViewCommand,
  PostUpdateCommand,
} from '../commands/post.commands';
import {
  PostGetByIdQuery,
  PostGetBySlugAnyStatusQuery,
  PostGetPublishedBySlugQuery,
  PostsGetAdminQuery,
  PostsGetPublishedQuery,
} from '../queries/post.queries';

@QueryHandler(PostsGetPublishedQuery)
export class PostsGetPublishedHandler implements IQueryHandler<PostsGetPublishedQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  execute({ locale, page, perPage }: PostsGetPublishedQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findPublished(locale, page, perPage);
  }
}

@QueryHandler(PostGetPublishedBySlugQuery)
export class PostGetPublishedBySlugHandler implements IQueryHandler<PostGetPublishedBySlugQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute({ locale, slug }: PostGetPublishedBySlugQuery): Promise<Post> {
    const found = await this.postRepository.findPublishedBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Post ${slug} not found.`);
    return found;
  }
}

/** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
@QueryHandler(PostGetBySlugAnyStatusQuery)
export class PostGetBySlugAnyStatusHandler implements IQueryHandler<PostGetBySlugAnyStatusQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute({ locale, slug }: PostGetBySlugAnyStatusQuery): Promise<Post> {
    const found = await this.postRepository.findBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Post ${slug} not found.`);
    return found;
  }
}

@QueryHandler(PostsGetAdminQuery)
export class PostsGetAdminHandler implements IQueryHandler<PostsGetAdminQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  execute({ page, perPage }: PostsGetAdminQuery): Promise<PaginatedResult<Post>> {
    return this.postRepository.findAllAdmin(page, perPage);
  }
}

@QueryHandler(PostGetByIdQuery)
export class PostGetByIdHandler implements IQueryHandler<PostGetByIdQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute({ id }: PostGetByIdQuery): Promise<Post> {
    const found = await this.postRepository.findById(id);
    if (!found) throw new NotFoundException(`Post ${id} not found.`);
    return found;
  }
}

@CommandHandler(PostCreateCommand)
export class PostCreateHandler implements ICommandHandler<PostCreateCommand> {
  constructor(private readonly postRepository: PostRepository) {}

  execute({ authorUserId, payload }: PostCreateCommand): Promise<Post> {
    return this.postRepository.create(authorUserId, payload);
  }
}

@CommandHandler(PostUpdateCommand)
export class PostUpdateHandler implements ICommandHandler<PostUpdateCommand> {
  constructor(private readonly postRepository: PostRepository) {}

  execute({ id, payload }: PostUpdateCommand): Promise<Post> {
    return this.postRepository.update(id, payload);
  }
}

@CommandHandler(PostDeleteCommand)
export class PostDeleteHandler implements ICommandHandler<PostDeleteCommand> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly fileRepository: FileRepository,
  ) {}

  async execute({ id }: PostDeleteCommand): Promise<void> {
    await this.postRepository.delete(id);
    await this.fileRepository.deleteByExternalId(id);
  }
}

@CommandHandler(PostRecordViewCommand)
export class PostRecordViewHandler implements ICommandHandler<PostRecordViewCommand> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly viewTrackingService: ViewTrackingService,
  ) {}

  async execute({ locale, slug, meta }: PostRecordViewCommand): Promise<void> {
    const found = await this.postRepository.findPublishedBySlug(locale, slug);
    if (!found) throw new NotFoundException(`Post ${slug} not found.`);

    const visitorHash = createHash('sha256')
      .update(`${meta.ip ?? ''}:${meta.userAgent ?? ''}`)
      .digest('hex');
    const shouldCount = await this.viewTrackingService.shouldCountView('post', found.id, visitorHash);
    if (shouldCount) {
      await this.postRepository.incrementViewCount(found.id);
    }
  }
}

@CommandHandler(PostsImportCommand)
export class PostsImportHandler implements ICommandHandler<PostsImportCommand> {
  constructor(private readonly postRepository: PostRepository) {}

  execute({ authorUserId, items }: PostsImportCommand) {
    return this.postRepository.importMany(authorUserId, items);
  }
}

export const PostQueryHandlers = [
  PostsGetPublishedHandler,
  PostGetPublishedBySlugHandler,
  PostGetBySlugAnyStatusHandler,
  PostsGetAdminHandler,
  PostGetByIdHandler,
];
export const PostCommandHandlers = [
  PostCreateHandler,
  PostUpdateHandler,
  PostDeleteHandler,
  PostRecordViewHandler,
  PostsImportHandler,
];
