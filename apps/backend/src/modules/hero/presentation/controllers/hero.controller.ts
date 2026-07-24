import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { HeroGetQuery } from '../../application/queries/hero-get.query';
import { HeroDto, HeroLocaleQuery } from '../dtos/hero.dto';
import { HeroMapper } from '../mappers/hero.mapper';

@ApiTags('hero')
@Controller('hero')
export class HeroController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get public hero content for the requested locale' })
  @ApiOkResponse({ type: HeroDto })
  async getHero(@Query() query: HeroLocaleQuery): Promise<HeroDto> {
    const hero = await this.queryBus.execute(new HeroGetQuery());
    if (!hero) throw new NotFoundException('Hero content is not configured yet.');
    return HeroMapper.toDto(hero, query.locale ?? 'ru');
  }
}
