import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { ReorderBody } from '@/common/Reorder';
import {
  ContactCreateCommand,
  ContactDeleteCommand,
  ContactReorderCommand,
  ContactUpdateCommand,
} from '../../application/commands/contact.commands';
import { ContactGetByIdQuery, ContactsGetQuery } from '../../application/queries/contact.queries';
import { ContactAdminDto, CreateContactBody, UpdateContactBody } from '../dtos/contact.dto';
import { ContactMapper } from '../mappers/contact.mapper';

@ApiTags('admin/contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/contacts')
export class ContactAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.CONTACT)
  @ApiOperation({ summary: 'Get all contacts, including hidden ones (admin)' })
  @ApiOkResponse({ type: [ContactAdminDto] })
  async getContacts(): Promise<ContactAdminDto[]> {
    const contacts = await this.queryBus.execute(new ContactsGetQuery(false));
    return contacts.map(ContactMapper.toAdminDto);
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.CONTACT)
  @ApiOperation({ summary: 'Get contact by ID (admin)' })
  @ApiOkResponse({ type: ContactAdminDto })
  @ApiNotFoundResponse({ description: 'Contact not found.' })
  async getContact(@Param('id', ParseUUIDPipe) id: string): Promise<ContactAdminDto> {
    const contact = await this.queryBus.execute(new ContactGetByIdQuery(id));
    return ContactMapper.toAdminDto(contact);
  }

  @Post()
  @Policy(Actions.CREATE, Subjects.CONTACT)
  @ApiOperation({ summary: 'Create contact (admin)' })
  @ApiCreatedResponse({ type: ContactAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async createContact(@Body() body: CreateContactBody): Promise<ContactAdminDto> {
    const contact = await this.commandBus.execute(new ContactCreateCommand(body));
    return ContactMapper.toAdminDto(contact);
  }

  @Patch('reorder')
  @Policy(Actions.UPDATE, Subjects.CONTACT)
  @ApiOperation({ summary: 'Bulk-reorder contacts for drag-and-drop (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async reorderContacts(@Body() body: ReorderBody): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ContactReorderCommand(body.items));
    return { success: true };
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.CONTACT)
  @ApiOperation({ summary: 'Update contact (admin)' })
  @ApiOkResponse({ type: ContactAdminDto })
  @ApiNotFoundResponse({ description: 'Contact not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContactBody,
  ): Promise<ContactAdminDto> {
    const contact = await this.commandBus.execute(new ContactUpdateCommand(id, body));
    return ContactMapper.toAdminDto(contact);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.CONTACT)
  @ApiOperation({ summary: 'Delete contact (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Contact not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deleteContact(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ContactDeleteCommand(id));
    return { success: true };
  }
}
