import { SiteSettingGetHandler } from './site-setting-get.handler';
import { SiteSettingRepository } from '../../domain/repositories/site-setting.repository';
import { SiteSetting } from '../../domain/entities/site-setting.entity';

describe('SiteSettingGetHandler', () => {
  it('returns whatever the repository resolves, including null', async () => {
    const repository: jest.Mocked<SiteSettingRepository> = {
      get: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    const handler = new SiteSettingGetHandler(repository);

    await expect(handler.execute()).resolves.toBeNull();

    const siteSetting = new SiteSetting({ id: 'site-setting-id', translations: {} });
    repository.get.mockResolvedValue(siteSetting);
    await expect(handler.execute()).resolves.toBe(siteSetting);
  });
});
