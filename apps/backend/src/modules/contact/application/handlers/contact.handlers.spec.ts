import {
  ContactCreateHandler,
  ContactDeleteHandler,
  ContactGetByIdHandler,
  ContactReorderHandler,
  ContactsGetHandler,
  ContactUpdateHandler,
} from './contact.handlers';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import {
  ContactCreateCommand,
  ContactDeleteCommand,
  ContactReorderCommand,
  ContactUpdateCommand,
} from '../commands/contact.commands';
import { ContactGetByIdQuery, ContactsGetQuery } from '../queries/contact.queries';
import { Contact } from '../../domain/entities/contact.entity';
import { ContactPlatform } from '@/enums/contact-platform.enum';

describe('Contact handlers', () => {
  const contact = new Contact({
    id: 'contact-id',
    platform: ContactPlatform.GITHUB,
    value: 'https://github.com/example',
    position: 0,
    isVisible: true,
  });

  function mockRepository(): jest.Mocked<ContactRepository> {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };
  }

  it('ContactsGetHandler delegates to findAll with the visibleOnly flag', async () => {
    const repository = mockRepository();
    repository.findAll.mockResolvedValue([contact]);
    const handler = new ContactsGetHandler(repository);

    await handler.execute(new ContactsGetQuery(true));

    expect(repository.findAll).toHaveBeenCalledWith(true);
  });

  it('ContactGetByIdHandler throws NotFoundException when missing', async () => {
    const repository = mockRepository();
    repository.findById.mockResolvedValue(null);
    const handler = new ContactGetByIdHandler(repository);

    await expect(handler.execute(new ContactGetByIdQuery('missing'))).rejects.toThrow('missing');
  });

  it('ContactCreateHandler delegates to create', async () => {
    const repository = mockRepository();
    repository.create.mockResolvedValue(contact);
    const handler = new ContactCreateHandler(repository);
    const payload = { platform: ContactPlatform.GITHUB, value: 'https://github.com/example' };

    const result = await handler.execute(new ContactCreateCommand(payload));

    expect(repository.create).toHaveBeenCalledWith(payload);
    expect(result).toBe(contact);
  });

  it('ContactUpdateHandler delegates to update', async () => {
    const repository = mockRepository();
    repository.update.mockResolvedValue(contact);
    const handler = new ContactUpdateHandler(repository);

    await handler.execute(new ContactUpdateCommand('contact-id', { isVisible: false }));

    expect(repository.update).toHaveBeenCalledWith('contact-id', { isVisible: false });
  });

  it('ContactDeleteHandler delegates to delete', async () => {
    const repository = mockRepository();
    const handler = new ContactDeleteHandler(repository);

    await handler.execute(new ContactDeleteCommand('contact-id'));

    expect(repository.delete).toHaveBeenCalledWith('contact-id');
  });

  it('ContactReorderHandler delegates to reorder', async () => {
    const repository = mockRepository();
    const handler = new ContactReorderHandler(repository);
    const items = [{ id: 'contact-id', position: 1 }];

    await handler.execute(new ContactReorderCommand(items));

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
