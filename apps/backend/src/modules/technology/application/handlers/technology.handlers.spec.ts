import {
  TechnologiesGetHandler,
  TechnologyCreateHandler,
  TechnologyDeleteHandler,
  TechnologyGetByIdHandler,
  TechnologyReorderHandler,
  TechnologyUpdateHandler,
} from './technology.handlers';
import { TechnologyRepository } from '../../domain/repositories/technology.repository';
import {
  TechnologyCreateCommand,
  TechnologyDeleteCommand,
  TechnologyReorderCommand,
  TechnologyUpdateCommand,
} from '../commands/technology.commands';
import { TechnologiesGetQuery, TechnologyGetByIdQuery } from '../queries/technology.queries';
import { Technology } from '../../domain/entities/technology.entity';
import { TechnologyCategory } from '@/enums/technology-category.enum';

describe('Technology handlers', () => {
  const technology = new Technology({
    id: 'tech-id',
    name: 'TypeScript',
    category: TechnologyCategory.LANGUAGE,
    position: 0,
  });

  function mockRepository(): jest.Mocked<TechnologyRepository> {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };
  }

  it('TechnologiesGetHandler delegates to findAll with page/perPage', async () => {
    const repository = mockRepository();
    repository.findAll.mockResolvedValue({ data: [technology], meta: { total: 1, page: 1, per_page: 20, pages: 1 } });
    const handler = new TechnologiesGetHandler(repository);

    await handler.execute(new TechnologiesGetQuery(2, 10));

    expect(repository.findAll).toHaveBeenCalledWith(2, 10);
  });

  it('TechnologyGetByIdHandler throws NotFoundException when missing', async () => {
    const repository = mockRepository();
    repository.findById.mockResolvedValue(null);
    const handler = new TechnologyGetByIdHandler(repository);

    await expect(handler.execute(new TechnologyGetByIdQuery('missing'))).rejects.toThrow('missing');
  });

  it('TechnologyCreateHandler delegates to create', async () => {
    const repository = mockRepository();
    repository.create.mockResolvedValue(technology);
    const handler = new TechnologyCreateHandler(repository);

    const result = await handler.execute(new TechnologyCreateCommand({ name: 'TypeScript' }));

    expect(repository.create).toHaveBeenCalledWith({ name: 'TypeScript' });
    expect(result).toBe(technology);
  });

  it('TechnologyUpdateHandler delegates to update', async () => {
    const repository = mockRepository();
    repository.update.mockResolvedValue(technology);
    const handler = new TechnologyUpdateHandler(repository);

    await handler.execute(new TechnologyUpdateCommand('tech-id', { name: 'TS' }));

    expect(repository.update).toHaveBeenCalledWith('tech-id', { name: 'TS' });
  });

  it('TechnologyDeleteHandler delegates to delete', async () => {
    const repository = mockRepository();
    const handler = new TechnologyDeleteHandler(repository);

    await handler.execute(new TechnologyDeleteCommand('tech-id'));

    expect(repository.delete).toHaveBeenCalledWith('tech-id');
  });

  it('TechnologyReorderHandler delegates to reorder', async () => {
    const repository = mockRepository();
    const handler = new TechnologyReorderHandler(repository);
    const items = [{ id: 'tech-id', position: 1 }];

    await handler.execute(new TechnologyReorderCommand(items));

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
