import { Post } from '../../domain/entities/post.entity';
import { PostMapper } from './post.mapper';

describe('PostMapper', () => {
  const entity = new Post({
    id: 'post-id',
    authorUserId: 'author-id',
    status: 'PUBLISHED' as any,
    viewCount: 3,
    locale: 'ru',
    title: 'Статья',
    slug: 'statya',
    excerpt: 'Кратко',
    body: 'Текст',
  });

  it('toDto maps the flat single-locale fields as-is', () => {
    const dto = PostMapper.toDto(entity);
    expect(dto.locale).toBe('ru');
    expect(dto.slug).toBe('statya');
    expect(dto.title).toBe('Статья');
  });

  it('toAdminDto includes authorUserId alongside the same flat fields', () => {
    const dto = PostMapper.toAdminDto(entity);
    expect(dto.authorUserId).toBe('author-id');
    expect(dto.locale).toBe('ru');
    expect(dto.slug).toBe('statya');
  });
});
