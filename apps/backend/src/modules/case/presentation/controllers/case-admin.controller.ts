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
  CaseCreateCommand,
  CaseDeleteCommand,
  CaseReorderCommand,
  CaseUpdateCommand,
} from '../../application/commands/case.commands';
import {
  CaseGetByIdQuery,
  CaseGetBySlugAnyStatusQuery,
  CasesGetAdminQuery,
} from '../../application/queries/case.queries';
import {
  CaseAdminDto,
  CaseDto,
  CaseLocaleQuery,
  CasesAdminDto,
  CreateCaseBody,
  UpdateCaseBody,
} from '../dtos/case.dto';
import { CaseMapper } from '../mappers/case.mapper';

@ApiTags('admin/cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/cases')
export class CaseAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.CASE)
  @ApiOperation({ summary: 'Get all cases regardless of status (admin)' })
  @ApiOkResponse({ type: CasesAdminDto })
  async getCases(@Query() query: PaginationQuery): Promise<CasesAdminDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const result = await this.queryBus.execute(new CasesGetAdminQuery(page, perPage));
    return { ...result, data: result.data.map((c) => CaseMapper.toAdminDto(c)) };
  }

  @Get('preview/:slug')
  @Policy(Actions.READ, Subjects.CASE)
  @ApiOperation({
    summary:
      'Get a case by slug regardless of status (admin) — backs Draft Mode preview (docs/planning/05-admin-panel.md §3)',
  })
  @ApiOkResponse({ type: CaseDto })
  @ApiNotFoundResponse({ description: 'Case not found.' })
  async previewCase(@Param('slug') slug: string, @Query() query: CaseLocaleQuery): Promise<CaseDto> {
    const locale = query.locale ?? 'ru';
    const found = await this.queryBus.execute(new CaseGetBySlugAnyStatusQuery(locale, slug));
    return CaseMapper.toDto(found, locale);
  }

  @Get(':id')
  @Policy(Actions.READ, Subjects.CASE)
  @ApiOperation({ summary: 'Get case by ID with all translations (admin)' })
  @ApiOkResponse({ type: CaseAdminDto })
  @ApiNotFoundResponse({ description: 'Case not found.' })
  async getCase(@Param('id', ParseUUIDPipe) id: string): Promise<CaseAdminDto> {
    const found = await this.queryBus.execute(new CaseGetByIdQuery(id));
    return CaseMapper.toAdminDto(found);
  }

  @Post()
  @Policy(Actions.CREATE, Subjects.CASE)
  @ApiOperation({ summary: 'Create case as DRAFT (admin)' })
  @ApiCreatedResponse({ type: CaseAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async createCase(@Body() body: CreateCaseBody): Promise<CaseAdminDto> {
    const created = await this.commandBus.execute(new CaseCreateCommand(body));
    return CaseMapper.toAdminDto(created);
  }

  @Patch('reorder')
  @Policy(Actions.UPDATE, Subjects.CASE)
  @ApiOperation({ summary: 'Bulk-reorder cases for drag-and-drop (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async reorderCases(@Body() body: ReorderBody): Promise<{ success: boolean }> {
    await this.commandBus.execute(new CaseReorderCommand(body.items));
    return { success: true };
  }

  @Patch(':id')
  @Policy(Actions.UPDATE, Subjects.CASE)
  @ApiOperation({ summary: 'Update case, including publish/unpublish via status (admin)' })
  @ApiOkResponse({ type: CaseAdminDto })
  @ApiNotFoundResponse({ description: 'Case not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateCase(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCaseBody): Promise<CaseAdminDto> {
    const updated = await this.commandBus.execute(new CaseUpdateCommand(id, body));
    return CaseMapper.toAdminDto(updated);
  }

  @Delete(':id')
  @Policy(Actions.DELETE, Subjects.CASE)
  @ApiOperation({ summary: 'Soft-delete a case (admin)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Case not found.' })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async deleteCase(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new CaseDeleteCommand(id));
    return { success: true };
  }
}
