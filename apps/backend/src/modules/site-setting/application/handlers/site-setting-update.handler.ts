import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { SiteSettingRepository } from '../../domain/repositories/site-setting.repository';
import { SiteSettingUpdateCommand } from '../commands/site-setting-update.command';

@CommandHandler(SiteSettingUpdateCommand)
export class SiteSettingUpdateHandler implements ICommandHandler<SiteSettingUpdateCommand> {
  constructor(private readonly siteSettingRepository: SiteSettingRepository) {}

  execute({ payload }: SiteSettingUpdateCommand): Promise<SiteSetting> {
    return this.siteSettingRepository.update(payload);
  }
}
