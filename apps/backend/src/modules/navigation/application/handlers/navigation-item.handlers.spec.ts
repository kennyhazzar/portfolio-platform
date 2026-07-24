import {
  NavigationItemCreateHandler,
  NavigationItemDeleteHandler,
  NavigationItemGetByIdHandler,
  NavigationItemReorderHandler,
  NavigationItemsGetHandler,
  NavigationItemUpdateHandler,
} from './navigation-item.handlers';
import { NavigationItemRepository } from '../../domain/repositories/navigation-item.repository';
import {
  NavigationItemCreateCommand,
  NavigationItemDeleteCommand,
  NavigationItemReorderCommand,
  NavigationItemUpdateCommand,
} from '../commands/navigation-item.commands';
import { NavigationItemGetByIdQuery, NavigationItemsGetQuery } from '../queries/navigation-item.queries';
import { NavigationItem } from '../../domain/entities/navigation-item.entity';

describe('NavigationItem handlers', () => {
  const item = new NavigationItem({
    id: 'nav-id',
    url: '/cases',
    position: 0,
    isVisible: true,
    translations: { ru: { locale: 'ru', label: 'Кейсы' }, en: { locale: 'en', label: 'Cases' } },
  });

  function mockRepository(): jest.Mocked<NavigationItemRepository> {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };
  }

  it('NavigationItemsGetHandler delegates to findAll with the visibleOnly flag', async () => {
    const repository = mockRepository();
    repository.findAll.mockResolvedValue([item]);
    const handler = new NavigationItemsGetHandler(repository);

    await handler.execute(new NavigationItemsGetQuery(true));

    expect(repository.findAll).toHaveBeenCalledWith(true);
  });

  it('NavigationItemGetByIdHandler throws NotFoundException when missing', async () => {
    const repository = mockRepository();
    repository.findById.mockResolvedValue(null);
    const handler = new NavigationItemGetByIdHandler(repository);

    await expect(handler.execute(new NavigationItemGetByIdQuery('missing'))).rejects.toThrow('missing');
  });

  it('NavigationItemCreateHandler delegates to create', async () => {
    const repository = mockRepository();
    repository.create.mockResolvedValue(item);
    const handler = new NavigationItemCreateHandler(repository);
    const payload = { url: '/cases', ru: { label: 'Кейсы' }, en: { label: 'Cases' } };

    const result = await handler.execute(new NavigationItemCreateCommand(payload));

    expect(repository.create).toHaveBeenCalledWith(payload);
    expect(result).toBe(item);
  });

  it('NavigationItemUpdateHandler delegates to update', async () => {
    const repository = mockRepository();
    repository.update.mockResolvedValue(item);
    const handler = new NavigationItemUpdateHandler(repository);

    await handler.execute(new NavigationItemUpdateCommand('nav-id', { url: '/new' }));

    expect(repository.update).toHaveBeenCalledWith('nav-id', { url: '/new' });
  });

  it('NavigationItemDeleteHandler delegates to delete', async () => {
    const repository = mockRepository();
    const handler = new NavigationItemDeleteHandler(repository);

    await handler.execute(new NavigationItemDeleteCommand('nav-id'));

    expect(repository.delete).toHaveBeenCalledWith('nav-id');
  });

  it('NavigationItemReorderHandler delegates to reorder', async () => {
    const repository = mockRepository();
    const handler = new NavigationItemReorderHandler(repository);
    const items = [{ id: 'nav-id', position: 2 }];

    await handler.execute(new NavigationItemReorderCommand(items));

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
