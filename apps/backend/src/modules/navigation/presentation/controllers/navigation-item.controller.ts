import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { NavigationItemsGetQuery } from '../../application/queries/navigation-item.queries';
import { NavigationItemDto, NavigationLocaleQuery } from '../dtos/navigation-item.dto';
import { NavigationItemMapper } from '../mappers/navigation-item.mapper';

@ApiTags('navigation')
@Controller('navigation')
export class NavigationItemController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get the public site menu (visible items only), ordered by position' })
  @ApiOkResponse({ type: [NavigationItemDto] })
  async getNavigation(@Query() query: NavigationLocaleQuery): Promise<NavigationItemDto[]> {
    const items = await this.queryBus.execute(new NavigationItemsGetQuery(true));
    return items.map((item) => NavigationItemMapper.toDto(item, query.locale ?? 'ru'));
  }
}
