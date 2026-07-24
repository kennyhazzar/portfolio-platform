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
  NavigationItemCreateCommand,
  NavigationItemDeleteCommand,
  NavigationItemReorderCommand,
  NavigationItemUpdateCommand,
} from '../../application/commands/navigation-item.commands';
import { NavigationItemGetByIdQuery, NavigationItemsGetQuery } from '../../application/queries/navigation-item.queries';
import {
  CreateNavigationItemBody,
  NavigationItemAdminDto,
  UpdateNavigationItemBody,
} from '../dtos/navigation-item.dto';
import { NavigationItemMapper } from '../mappers/navigation-item.mapper';

@ApiTags('admin/navigation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/navigation')
export class NavigationItemAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Get all navigation items, including hidden ones (admin)' })
  @ApiOkResponse({ type: [NavigationItemAdminDto] })
  async getNavigationItems(): Promise<NavigationItemAdminDto[]> {
    const items = await this.queryBus.execute(new NavigationItemsGetQuery(false));
    return items.map(NavigationItemMapper.toAdminDto);
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Get navigation item by ID (admin)' })
  @ApiOkResponse({ type: NavigationItemAdminDto })
  @ApiNotFoundResponse({ description: 'Navigation item not found.' })
  async getNavigationItem(@Param('id', ParseUUIDPipe) id: string): Promise<NavigationItemAdminDto> {
    const item = await this.queryBus.execute(new NavigationItemGetByIdQuery(id));
    return NavigationItemMapper.toAdminDto(item);
  }

  @Post()
  @Policy(Actions.CREATE, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Create navigation item (admin)' })
  @ApiCreatedResponse({ type: NavigationItemAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async createNavigationItem(@Body() body: CreateNavigationItemBody): Promise<NavigationItemAdminDto> {
    const item = await this.commandBus.execute(new NavigationItemCreateCommand(body));
    return NavigationItemMapper.toAdminDto(item);
  }

  @Patch('reorder')
  @Policy(Actions.UPDATE, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Bulk-reorder navigation items for drag-and-drop (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async reorderNavigationItems(@Body() body: ReorderBody): Promise<{ success: boolean }> {
    await this.commandBus.execute(new NavigationItemReorderCommand(body.items));
    return { success: true };
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Update navigation item (admin)' })
  @ApiOkResponse({ type: NavigationItemAdminDto })
  @ApiNotFoundResponse({ description: 'Navigation item not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateNavigationItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateNavigationItemBody,
  ): Promise<NavigationItemAdminDto> {
    const item = await this.commandBus.execute(new NavigationItemUpdateCommand(id, body));
    return NavigationItemMapper.toAdminDto(item);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.NAVIGATION)
  @ApiOperation({ summary: 'Delete navigation item (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Navigation item not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deleteNavigationItem(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new NavigationItemDeleteCommand(id));
    return { success: true };
  }
}
