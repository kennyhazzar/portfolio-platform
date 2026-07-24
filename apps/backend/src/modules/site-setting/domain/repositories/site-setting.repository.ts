import { SiteSetting } from '../entities/site-setting.entity';
import { UpdateSiteSettingBody } from '../../presentation/dtos/site-setting.dto';

export abstract class SiteSettingRepository {
  abstract get(): Promise<SiteSetting | null>;
  abstract update(update: UpdateSiteSettingBody): Promise<SiteSetting>;
}
