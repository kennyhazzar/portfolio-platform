import { IdType } from '@/interfaces/id.type';
import { Locale } from '@/interfaces/locale.type';
import { CommentStatus } from '@/enums/comment-status.enum';

export class Comment {
  id!: IdType;
  postId?: IdType;
  caseId?: IdType;
  parentCommentId?: IdType;
  authorName!: string;
  authorEmail?: string;
  authorUrl?: string;
  body!: string;
  status!: CommentStatus;
  locale!: Locale;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Comment) {
    Object.assign(this, data);
  }
}
