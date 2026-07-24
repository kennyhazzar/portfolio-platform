import { CaseGetPublishedBySlugHandler, CaseReorderHandler, CaseUpdateHandler } from './case.handlers';
import { CaseRepository } from '../../domain/repositories/case.repository';
import { CaseReorderCommand, CaseUpdateCommand } from '../commands/case.commands';
import { CaseGetPublishedBySlugQuery } from '../queries/case.queries';
import { Case } from '../../domain/entities/case.entity';

describe('Case handlers', () => {
  const found = new Case({
    id: 'case-id',
    status: 'PUBLISHED' as any,
    position: 0,
    viewCount: 0,
    technologies: [],
    translations: { ru: { locale: 'ru', title: 'Т', slug: 'moi-proekt', summary: 's', body: 'b' } },
  });

  function mockRepository(): jest.Mocked<CaseRepository> {
    return {
      findPublished: jest.fn(),
      findPublishedBySlug: jest.fn(),
      findAllAdmin: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };
  }

  it('CaseGetPublishedBySlugHandler throws NotFoundException when the slug does not resolve', async () => {
    const repository = mockRepository();
    repository.findPublishedBySlug.mockResolvedValue(null);
    const handler = new CaseGetPublishedBySlugHandler(repository);

    await expect(handler.execute(new CaseGetPublishedBySlugQuery('ru', 'missing'))).rejects.toThrow('missing');
  });

  it('CaseGetPublishedBySlugHandler returns the found case', async () => {
    const repository = mockRepository();
    repository.findPublishedBySlug.mockResolvedValue(found);
    const handler = new CaseGetPublishedBySlugHandler(repository);

    const result = await handler.execute(new CaseGetPublishedBySlugQuery('ru', 'moi-proekt'));

    expect(repository.findPublishedBySlug).toHaveBeenCalledWith('ru', 'moi-proekt');
    expect(result).toBe(found);
  });

  it('CaseUpdateHandler delegates to update, including a status change to publish', async () => {
    const repository = mockRepository();
    repository.update.mockResolvedValue(found);
    const handler = new CaseUpdateHandler(repository);

    await handler.execute(new CaseUpdateCommand('case-id', { status: 'PUBLISHED' as any }));

    expect(repository.update).toHaveBeenCalledWith('case-id', { status: 'PUBLISHED' });
  });

  it('CaseReorderHandler delegates to reorder', async () => {
    const repository = mockRepository();
    const handler = new CaseReorderHandler(repository);
    const items = [{ id: 'case-id', position: 3 }];

    await handler.execute(new CaseReorderCommand(items));

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
