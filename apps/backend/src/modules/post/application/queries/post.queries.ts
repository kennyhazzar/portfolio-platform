import { Query } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { Locale } from '@/interfaces/locale.type';
import { Post } from '../../domain/entities/post.entity';

export class PostsGetPublishedQuery extends Query<PaginatedResult<Post>> {
  constructor(
    public readonly locale: Locale,
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class PostGetPublishedBySlugQuery extends Query<Post> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
  ) {
    super();
  }
}

export class PostsGetAdminQuery extends Query<PaginatedResult<Post>> {
  constructor(
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class PostGetByIdQuery extends Query<Post> {
  constructor(public readonly id: string) {
    super();
  }
}

/** Any status — admin-only, backs Draft Mode preview (docs/planning/05-admin-panel.md §3). */
export class PostGetBySlugAnyStatusQuery extends Query<Post> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
  ) {
    super();
  }
}
