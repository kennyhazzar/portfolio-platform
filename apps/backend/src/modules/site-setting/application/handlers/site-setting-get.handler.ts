import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { SiteSettingRepository } from '../../domain/repositories/site-setting.repository';
import { SiteSettingGetQuery } from '../queries/site-setting-get.query';

@QueryHandler(SiteSettingGetQuery)
export class SiteSettingGetHandler implements IQueryHandler<SiteSettingGetQuery> {
  constructor(private readonly siteSettingRepository: SiteSettingRepository) {}

  execute(): Promise<SiteSetting | null> {
    return this.siteSettingRepository.get();
  }
}
