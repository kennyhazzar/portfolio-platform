import { Query } from '@nestjs/cqrs';

import { PaginatedResult } from '@/common/Paginated';
import { CommentStatus } from '@/enums/comment-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { CommentTargetType } from '../../domain/comment-target.type';
import { Comment } from '../../domain/entities/comment.entity';

export class CommentsGetApprovedBySlugQuery extends Query<PaginatedResult<Comment>> {
  constructor(
    public readonly targetType: CommentTargetType,
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
