import { SiteSettingUpdateHandler } from './site-setting-update.handler';
import { SiteSettingRepository } from '../../domain/repositories/site-setting.repository';
import { SiteSettingUpdateCommand } from '../commands/site-setting-update.command';
import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { UpdateSiteSettingBody } from '../../presentation/dtos/site-setting.dto';

describe('SiteSettingUpdateHandler', () => {
  it('delegates the update to the repository and returns the updated entity', async () => {
    const updated = new SiteSetting({
      id: 'site-setting-id',
      translations: {
        ru: { locale: 'ru', title: 'Портфолио', description: 'Описание' },
        en: { locale: 'en', title: 'Portfolio', description: 'Description' },
      },
    });
    const repository: jest.Mocked<SiteSettingRepository> = {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(updated),
    };
    const handler = new SiteSettingUpdateHandler(repository);
    const payload: UpdateSiteSettingBody = {
      ru: { title: 'Портфолио', description: 'Описание' },
      en: { title: 'Portfolio', description: 'Description' },
    };

    const result = await handler.execute(new SiteSettingUpdateCommand(payload));

    expect(repository.update).toHaveBeenCalledWith(payload);
    expect(result).toBe(updated);
  });
});
