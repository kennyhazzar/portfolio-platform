import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';

import { SiteSettingGetQuery } from '../../application/queries/site-setting-get.query';
import { SiteSettingDto, SiteSettingLocaleQuery } from '../dtos/site-setting.dto';
import { SiteSettingMapper } from '../mappers/site-setting.mapper';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get public site settings for the requested locale' })
  @ApiOkResponse({ type: SiteSettingDto })
  async getSiteSetting(@Query() query: SiteSettingLocaleQuery): Promise<SiteSettingDto> {
    const siteSetting = await this.queryBus.execute(new SiteSettingGetQuery());
    if (!siteSetting) throw new NotFoundException('Site settings are not configured yet.');
    return SiteSettingMapper.toDto(siteSetting, query.locale ?? 'ru');
  }
}
