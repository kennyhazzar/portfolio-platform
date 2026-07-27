import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { PaginationQuery } from '@/common/Paginated';
import { ReorderBody } from '@/common/Reorder';
import {
  TechnologyCreateCommand,
  TechnologyDeleteCommand,
  TechnologiesImportCommand,
  TechnologyReorderCommand,
  TechnologyUpdateCommand,
} from '../../application/commands/technology.commands';
import { TechnologiesGetQuery, TechnologyGetByIdQuery } from '../../application/queries/technology.queries';
import {
  CreateTechnologyBody,
  ImportResultDto,
  ImportTechnologiesBody,
  TechnologiesDto,
  TechnologyDto,
  UpdateTechnologyBody,
} from '../dtos/technology.dto';
import { TechnologyMapper } from '../mappers/technology.mapper';

@ApiTags('admin/technologies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/technologies')
export class TechnologyAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Get all technologies (admin)' })
  @ApiOkResponse({ type: TechnologiesDto })
  async getTechnologies(@Query() query: PaginationQuery): Promise<TechnologiesDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const result = await this.queryBus.execute(new TechnologiesGetQuery(page, perPage));
    return { ...result, data: result.data.map(TechnologyMapper.toDto) };
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Get technology by ID (admin)' })
  @ApiOkResponse({ type: TechnologyDto })
  @ApiNotFoundResponse({ description: 'Technology not found.' })
  async getTechnology(@Param('id', ParseUUIDPipe) id: string): Promise<TechnologyDto> {
    const technology = await this.queryBus.execute(new TechnologyGetByIdQuery(id));
    return TechnologyMapper.toDto(technology);
  }

  @Post()
  @Policy(Actions.CREATE, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Create technology (admin)' })
  @ApiCreatedResponse({ type: TechnologyDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async createTechnology(@Body() body: CreateTechnologyBody): Promise<TechnologyDto> {
    const technology = await this.commandBus.execute(new TechnologyCreateCommand(body));
    return TechnologyMapper.toDto(technology);
  }

  @Post('import')
  @Policy(Actions.CREATE, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Bulk-import technologies by name (admin)' })
  @ApiCreatedResponse({ type: ImportResultDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  importTechnologies(@Body() body: ImportTechnologiesBody): Promise<ImportResultDto> {
    return this.commandBus.execute(new TechnologiesImportCommand(body.items));
  }

  @Patch('reorder')
  @Policy(Actions.UPDATE, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Bulk-reorder technologies for drag-and-drop (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async reorderTechnologies(@Body() body: ReorderBody): Promise<{ success: boolean }> {
    await this.commandBus.execute(new TechnologyReorderCommand(body.items));
    return { success: true };
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Update technology (admin)' })
  @ApiOkResponse({ type: TechnologyDto })
  @ApiNotFoundResponse({ description: 'Technology not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateTechnology(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTechnologyBody,
  ): Promise<TechnologyDto> {
    const technology = await this.commandBus.execute(new TechnologyUpdateCommand(id, body));
    return TechnologyMapper.toDto(technology);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.TECHNOLOGY)
  @ApiOperation({ summary: 'Delete technology (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Technology not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deleteTechnology(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new TechnologyDeleteCommand(id));
    return { success: true };
  }
}
