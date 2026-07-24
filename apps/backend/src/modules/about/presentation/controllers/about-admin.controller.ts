import { Body, Controller, Get, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { AboutUpdateCommand } from '../../application/commands/about-update.command';
import { AboutGetQuery } from '../../application/queries/about-get.query';
import { AboutAdminDto, UpdateAboutBody } from '../dtos/about.dto';
import { AboutMapper } from '../mappers/about.mapper';

@ApiTags('admin/about')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/about')
export class AboutAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.ABOUT)
  @ApiOperation({ summary: 'Get about content with all translations (admin)' })
  @ApiOkResponse({ type: AboutAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async getAbout(): Promise<AboutAdminDto> {
    const about = await this.queryBus.execute(new AboutGetQuery());
    if (!about) throw new NotFoundException('About content is not configured yet.');
    return AboutMapper.toAdminDto(about);
  }

  @Patch()
  @Policy(Actions.UPDATE, Subjects.ABOUT)
  @ApiOperation({ summary: 'Update about content (admin) — no create/delete, this is a singleton' })
  @ApiOkResponse({ type: AboutAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateAbout(@Body() body: UpdateAboutBody): Promise<AboutAdminDto> {
    const about = await this.commandBus.execute(new AboutUpdateCommand(body));
    return AboutMapper.toAdminDto(about);
  }
}
