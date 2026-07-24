import { Command } from '@nestjs/cqrs';

import { ReorderItemBody } from '@/common/Reorder';
import { Contact } from '../../domain/entities/contact.entity';
import { CreateContactBody, UpdateContactBody } from '../../presentation/dtos/contact.dto';

export class ContactCreateCommand extends Command<Contact> {
  constructor(public readonly payload: CreateContactBody) {
    super();
  }
}

export class ContactUpdateCommand extends Command<Contact> {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateContactBody,
  ) {
    super();
  }
}

export class ContactDeleteCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

export class ContactReorderCommand extends Command<void> {
  constructor(public readonly items: ReorderItemBody[]) {
    super();
  }
}
