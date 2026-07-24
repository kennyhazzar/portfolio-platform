import { PostCreateHandler, PostGetPublishedBySlugHandler, PostUpdateHandler } from './post.handlers';
import { PostRepository } from '../../domain/repositories/post.repository';
import { PostCreateCommand, PostUpdateCommand } from '../commands/post.commands';
import { PostGetPublishedBySlugQuery } from '../queries/post.queries';
import { Post } from '../../domain/entities/post.entity';

describe('Post handlers', () => {
  const found = new Post({
    id: 'post-id',
    authorUserId: 'author-id',
    status: 'PUBLISHED' as any,
    viewCount: 0,
    locale: 'ru',
    title: 'Т',
    slug: 'statya',
    excerpt: 's',
    body: 'b',
  });

  function mockRepository(): jest.Mocked<PostRepository> {
    return {
      findPublished: jest.fn(),
      findPublishedBySlug: jest.fn(),
      findBySlug: jest.fn(),
      findAllAdmin: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      incrementViewCount: jest.fn(),
    };
  }

  it('PostGetPublishedBySlugHandler throws NotFoundException when the slug does not resolve', async () => {
    const repository = mockRepository();
    repository.findPublishedBySlug.mockResolvedValue(null);
    const handler = new PostGetPublishedBySlugHandler(repository);

    await expect(handler.execute(new PostGetPublishedBySlugQuery('ru', 'missing'))).rejects.toThrow('missing');
  });

  it('PostCreateHandler passes the current admin as authorUserId', async () => {
    const repository = mockRepository();
    repository.create.mockResolvedValue(found);
    const handler = new PostCreateHandler(repository);
    const payload = { locale: 'ru' as const, title: 'Т', slug: 'statya', excerpt: 's', body: 'b' };

    await handler.execute(new PostCreateCommand('author-id', payload));

    expect(repository.create).toHaveBeenCalledWith('author-id', payload);
  });

  it('PostUpdateHandler delegates to update, including a status change to publish', async () => {
    const repository = mockRepository();
    repository.update.mockResolvedValue(found);
    const handler = new PostUpdateHandler(repository);

    await handler.execute(new PostUpdateCommand('post-id', { status: 'PUBLISHED' as any }));

    expect(repository.update).toHaveBeenCalledWith('post-id', { status: 'PUBLISHED' });
  });
});
