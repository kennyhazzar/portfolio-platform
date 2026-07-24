import { Query } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { CommentStatus } from '@/enums/comment-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { Comment } from '../../domain/entities/comment.entity';

export class CommentsGetApprovedByPostSlugQuery extends Query<PaginatedResult<Comment>> {
  constructor(
    public readonly locale: Locale,
    public readonly slug: string,
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class CommentsGetAdminQuery extends Query<PaginatedResult<Comment>> {
  constructor(
    public readonly status: CommentStatus | undefined,
    public readonly page = 1,
    public readonly perPage = 20,
  ) {
    super();
  }
}

export class CommentGetByIdQuery extends Query<Comment> {
  constructor(public readonly id: string) {
    super();
  }
}
