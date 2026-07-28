import { PaginatedResult } from '@/common/Paginated';
import { CommentStatus } from '@/enums/comment-status.enum';
import { Locale } from '@/interfaces/locale.type';
import { Comment } from '../entities/comment.entity';
import { CommentTargetType } from '../comment-target.type';
import { CreateCommentBody } from '../../presentation/dtos/comment.dto';

export abstract class CommentRepository {
  abstract findApprovedBySlug(
    targetType: CommentTargetType,
    locale: Locale,
    slug: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Comment>>;
  abstract findAllAdmin(
    status: CommentStatus | undefined,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Comment>>;
  abstract findById(id: string): Promise<Comment | null>;
  abstract createForSlug(
    targetType: CommentTargetType,
    locale: Locale,
    slug: string,
    body: CreateCommentBody,
    ipAddressHash?: string,
    initialStatus?: CommentStatus,
  ): Promise<Comment>;
  abstract updateStatus(id: string, status: CommentStatus): Promise<Comment>;
  abstract delete(id: string): Promise<void>;
}
