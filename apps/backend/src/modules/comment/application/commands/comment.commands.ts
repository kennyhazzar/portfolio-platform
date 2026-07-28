import { Command } from '@nestjs/cqrs';

import { CommentStatus } from '@/enums/comment-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { CommentTargetType } from '../../domain/comment-target.type';
import { Comment } from '../../domain/entities/comment.entity';
import { CreateCommentBody } from '../../presentation/dtos/comment.dto';

export interface CommentSubmitMeta {
  ip?: string;
  userAgent?: string;
}

export class CommentCreateCommand extends Command<Comment> {
  constructor(
    public readonly targetType: CommentTargetType,
    public readonly locale: Locale,
    public readonly slug: string,
    public readonly payload: CreateCommentBody,
    public readonly meta: CommentSubmitMeta,
  ) {
    super();
  }
}

export class CommentUpdateStatusCommand extends Command<Comment> {
  constructor(
    public readonly id: string,
    public readonly status: CommentStatus,
  ) {
    super();
  }
}

export class CommentDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
