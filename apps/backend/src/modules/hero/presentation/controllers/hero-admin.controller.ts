import { Body, Controller, Get, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/guards/policies.guard';
import { Policy } from '@/decorators/policy.decorator';
import { HeroUpdateCommand } from '../../application/commands/hero-update.command';
import { HeroGetQuery } from '../../application/queries/hero-get.query';
import { HeroAdminDto, UpdateHeroBody } from '../dtos/hero.dto';
import { HeroMapper } from '../mappers/hero.mapper';

@ApiTags('admin/hero')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/hero')
export class HeroAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Policy(Actions.READ, Subjects.HERO)
  @ApiOperation({ summary: 'Get hero content with all translations (admin)' })
  @ApiOkResponse({ type: HeroAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async getHero(): Promise<HeroAdminDto> {
    const hero = await this.queryBus.execute(new HeroGetQuery());
    if (!hero) throw new NotFoundException('Hero content is not configured yet.');
    return HeroMapper.toAdminDto(hero);
  }

  @Patch()
  @Policy(Actions.UPDATE, Subjects.HERO)
  @ApiOperation({ summary: 'Update hero content (admin) — no create/delete, this is a singleton' })
  @ApiOkResponse({ type: HeroAdminDto })
  @ApiForbiddenResponse({ description: 'Admin access required.' })
  async updateHero(@Body() body: UpdateHeroBody): Promise<HeroAdminDto> {
    const hero = await this.commandBus.execute(new HeroUpdateCommand(body));
    return HeroMapper.toAdminDto(hero);
  }
}
