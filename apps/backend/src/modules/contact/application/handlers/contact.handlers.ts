import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Contact } from '../../domain/entities/contact.entity';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import {
  ContactCreateCommand,
  ContactDeleteCommand,
  ContactReorderCommand,
  ContactUpdateCommand,
} from '../commands/contact.commands';
import { ContactGetByIdQuery, ContactsGetQuery } from '../queries/contact.queries';

@QueryHandler(ContactsGetQuery)
export class ContactsGetHandler implements IQueryHandler<ContactsGetQuery> {
  constructor(private readonly contactRepository: ContactRepository) {}

  execute({ visibleOnly }: ContactsGetQuery): Promise<Contact[]> {
    return this.contactRepository.findAll(visibleOnly);
  }
}

@QueryHandler(ContactGetByIdQuery)
export class ContactGetByIdHandler implements IQueryHandler<ContactGetByIdQuery> {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute({ id }: ContactGetByIdQuery): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) throw new NotFoundException(`Contact ${id} not found.`);
    return contact;
  }
}

@CommandHandler(ContactCreateCommand)
export class ContactCreateHandler implements ICommandHandler<ContactCreateCommand> {
  constructor(private readonly contactRepository: ContactRepository) {}

  execute({ payload }: ContactCreateCommand): Promise<Contact> {
    return this.contactRepository.create(payload);
  }
}

@CommandHandler(ContactUpdateCommand)
export class ContactUpdateHandler implements ICommandHandler<ContactUpdateCommand> {
  constructor(private readonly contactRepository: ContactRepository) {}

  execute({ id, payload }: ContactUpdateCommand): Promise<Contact> {
    return this.contactRepository.update(id, payload);
  }
}

@CommandHandler(ContactDeleteCommand)
export class ContactDeleteHandler implements ICommandHandler<ContactDeleteCommand> {
  constructor(private readonly contactRepository: ContactRepository) {}

  execute({ id }: ContactDeleteCommand): Promise<void> {
    return this.contactRepository.delete(id);
  }
}

@CommandHandler(ContactReorderCommand)
export class ContactReorderHandler implements ICommandHandler<ContactReorderCommand> {
  constructor(private readonly contactRepository: ContactRepository) {}

  execute({ items }: ContactReorderCommand): Promise<void> {
    return this.contactRepository.reorder(items);
  }
}

export const ContactQueryHandlers = [ContactsGetHandler, ContactGetByIdHandler];
export const ContactCommandHandlers = [
  ContactCreateHandler,
  ContactUpdateHandler,
  ContactDeleteHandler,
  ContactReorderHandler,
];
