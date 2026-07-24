import { Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FastifyRequest } from 'fastify';

import { CaseRecordViewCommand } from '../../application/commands/case.commands';
import { CaseGetPublishedBySlugQuery, CasesGetPublishedQuery } from '../../application/queries/case.queries';
import { CaseDto, CaseListQuery, CaseLocaleQuery, CasesDto } from '../dtos/case.dto';
import { CaseMapper } from '../mappers/case.mapper';

@ApiTags('cases')
@Controller('cases')
export class CaseController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get published cases, ordered by position' })
  @ApiOkResponse({ type: CasesDto })
  async getCases(@Query() query: CaseListQuery): Promise<CasesDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const locale = query.locale ?? 'ru';
    const result = await this.queryBus.execute(new CasesGetPublishedQuery(page, perPage));
    return { ...result, data: result.data.map((c) => CaseMapper.toDto(c, locale)) };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published case by its locale-specific slug' })
  @ApiOkResponse({ type: CaseDto })
  async getCase(@Param('slug') slug: string, @Query() query: CaseLocaleQuery): Promise<CaseDto> {
    const locale = query.locale ?? 'ru';
    const found = await this.queryBus.execute(new CaseGetPublishedBySlugQuery(locale, slug));
    return CaseMapper.toDto(found, locale);
  }

  @Post(':slug/view')
  @HttpCode(204)
  @ApiOperation({ summary: 'Record a view for a published case (deduped per visitor)' })
  @ApiNoContentResponse()
  async recordView(
    @Param('slug') slug: string,
    @Query() query: CaseLocaleQuery,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    const locale = query.locale ?? 'ru';
    await this.commandBus.execute(
      new CaseRecordViewCommand(locale, slug, { ip: req.ip, userAgent: req.headers['user-agent'] }),
    );
  }
}
