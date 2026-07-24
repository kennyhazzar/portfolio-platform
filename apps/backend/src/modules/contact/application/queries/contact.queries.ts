import { Query } from '@nestjs/cqrs';

import { Contact } from '../../domain/entities/contact.entity';

export class ContactsGetQuery extends Query<Contact[]> {
  constructor(public readonly visibleOnly: boolean) {
    super();
  }
}

export class ContactGetByIdQuery extends Query<Contact> {
  constructor(public readonly id: string) {
    super();
  }
}
