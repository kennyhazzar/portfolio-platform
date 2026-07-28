import { CommentStatus } from '@/enums/comment-status.enum';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentMapper } from './comment.mapper';

describe('CommentMapper', () => {
  const entity = new Comment({
    id: 'comment-id',
    postId: 'post-id',
    authorName: 'Reader',
    authorEmail: 'reader@example.com',
    body: 'Nice post!',
    status: CommentStatus.PENDING,
    locale: 'ru',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  });

  it('toDto never includes authorEmail', () => {
    const dto = CommentMapper.toDto(entity);
    expect(dto).not.toHaveProperty('authorEmail');
    expect(dto.authorName).toBe('Reader');
  });

  it('toAdminDto includes authorEmail, status, postId, and caseId for moderation', () => {
    const dto = CommentMapper.toAdminDto(entity);
    expect(dto.authorEmail).toBe('reader@example.com');
    expect(dto.status).toBe(CommentStatus.PENDING);
    expect(dto.postId).toBe('post-id');
    expect(dto.caseId).toBeUndefined();
  });
});
