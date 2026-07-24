import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { PaginationQuery } from '@/common/Paginated';
import { TechnologiesGetQuery } from '../../application/queries/technology.queries';
import { TechnologiesDto } from '../dtos/technology.dto';
import { TechnologyMapper } from '../mappers/technology.mapper';

@ApiTags('technologies')
@Controller('technologies')
export class TechnologyController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get the public technology stack list, ordered by position' })
  @ApiOkResponse({ type: TechnologiesDto })
  async getTechnologies(@Query() query: PaginationQuery): Promise<TechnologiesDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const result = await this.queryBus.execute(new TechnologiesGetQuery(page, perPage));
    return { ...result, data: result.data.map(TechnologyMapper.toDto) };
  }
}
