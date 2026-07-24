import { Body, Controller, Get, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { SiteSettingUpdateCommand } from '../../application/commands/site-setting-update.command';
import { SiteSettingGetQuery } from '../../application/queries/site-setting-get.query';
import { SiteSettingAdminDto, UpdateSiteSettingBody } from '../dtos/site-setting.dto';
import { SiteSettingMapper } from '../mappers/site-setting.mapper';

@ApiTags('admin/site-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/site-settings')
export class SiteSettingAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.SITE_SETTING)
  @ApiOperation({ summary: 'Get site settings with all translations (admin)' })
  @ApiOkResponse({ type: SiteSettingAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async getSiteSetting(): Promise<SiteSettingAdminDto> {
    const siteSetting = await this.queryBus.execute(new SiteSettingGetQuery());
    if (!siteSetting) throw new NotFoundException('Site settings are not configured yet.');
    return SiteSettingMapper.toAdminDto(siteSetting);
  }

  @Patch()
  @Policy(Actions.UPDATE, Subjects.SITE_SETTING)
  @ApiOperation({ summary: 'Update site settings (admin) — no create/delete, this is a singleton' })
  @ApiOkResponse({ type: SiteSettingAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateSiteSetting(@Body() body: UpdateSiteSettingBody): Promise<SiteSettingAdminDto> {
    const siteSetting = await this.commandBus.execute(new SiteSettingUpdateCommand(body));
    return SiteSettingMapper.toAdminDto(siteSetting);
  }
}
