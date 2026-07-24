import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { AboutGetQuery } from '../../application/queries/about-get.query';
import { AboutDto, AboutLocaleQuery } from '../dtos/about.dto';
import { AboutMapper } from '../mappers/about.mapper';

@ApiTags('about')
@Controller('about')
export class AboutController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get public about content for the requested locale' })
  @ApiOkResponse({ type: AboutDto })
  async getAbout(@Query() query: AboutLocaleQuery): Promise<AboutDto> {
    const about = await this.queryBus.execute(new AboutGetQuery());
    if (!about) throw new NotFoundException('About content is not configured yet.');
    return AboutMapper.toDto(about, query.locale ?? 'ru');
  }
}
