import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { ContactsGetQuery } from '../../application/queries/contact.queries';
import { ContactDto } from '../dtos/contact.dto';
import { ContactMapper } from '../mappers/contact.mapper';

@ApiTags('contacts')
@Controller('contacts')
export class ContactController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get visible contacts, ordered by position' })
  @ApiOkResponse({ type: [ContactDto] })
  async getContacts(): Promise<ContactDto[]> {
    const contacts = await this.queryBus.execute(new ContactsGetQuery(true));
    return contacts.map(ContactMapper.toDto);
  }
}
