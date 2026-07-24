import { Command } from '@nestjs/cqrs';

import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { UpdateSiteSettingBody } from '../../presentation/dtos/site-setting.dto';

export class SiteSettingUpdateCommand extends Command<SiteSetting> {
  constructor(public readonly payload: UpdateSiteSettingBody) {
    super();
  }
}
