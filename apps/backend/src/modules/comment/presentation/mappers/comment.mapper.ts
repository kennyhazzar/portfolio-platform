import { Comment } from '../../domain/entities/comment.entity';
import { CommentAdminDto, CommentDto, CreateCommentResponseDto } from '../dtos/comment.dto';

export class CommentMapper {
  static toDto(entity: Comment): CommentDto {
    return {
      id: entity.id,
      parentCommentId: entity.parentCommentId,
      authorName: entity.authorName,
      authorUrl: entity.authorUrl,
      body: entity.body,
      locale: entity.locale,
      createdAt: entity.createdAt!,
    };
  }

  static toCreateResponseDto(entity: Comment): CreateCommentResponseDto {
    return { ...CommentMapper.toDto(entity), status: entity.status };
  }

  static toAdminDto(entity: Comment): CommentAdminDto {
    return {
      ...CommentMapper.toDto(entity),
      authorEmail: entity.authorEmail,
      status: entity.status,
      postId: entity.postId,
    };
  }
}
