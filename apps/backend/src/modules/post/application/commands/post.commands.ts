import { Command } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { Post } from '../../domain/entities/post.entity';
import { CreatePostBody, ImportPostItemBody, ImportResultDto, UpdatePostBody } from '../../presentation/dtos/post.dto';

export interface ViewMeta {
  ip?: string;
  userAgent?: string;
}

export class PostCreateCommand extends Command<Post> {
  constructor(
    public readonly authorUserId: IdType,
    public readonly payload: CreatePostBody,
  ) {
    super();
  }
}

export class PostUpdateCommand extends Command<Post> {
  constructor(
    public readonly id: string,
    public readonly payload: UpdatePostBody,
  ) {
    super();
  }
}

export class PostDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

export class PostRecordViewCommand extends Command<void> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
    public readonly meta: ViewMeta,
  ) {
    super();
  }
}

export class PostsImportCommand extends Command<ImportResultDto> {
  constructor(
    public readonly authorUserId: IdType,
    public readonly items: ImportPostItemBody[],
  ) {
    super();
  }
}
