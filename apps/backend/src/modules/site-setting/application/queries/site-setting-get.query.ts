import { Query } from '@nestjs/cqrs';

import { SiteSetting } from '../../domain/entities/site-setting.entity';

export class SiteSettingGetQuery extends Query<SiteSetting | null> {
  constructor() {
    super();
  }
}
