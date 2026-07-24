import { runMigrations, getTestDb, truncateAll, closeTestDb } from '../../setup/database';
import { siteSetting, siteSettingTranslation } from '../../../apps/backend/src/common/drizzle/schema';
import { SiteSettingRepositoryDrizzle } from '../../../apps/backend/src/modules/site-setting/infrastructure/repositories/drizzle/site-setting.repository.drizzle';

describe('SiteSettingRepositoryDrizzle (integration)', () => {
  let repository: SiteSettingRepositoryDrizzle;
  let siteSettingId: string;

  beforeAll(async () => {
    await runMigrations();
    repository = new SiteSettingRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
    const [row] = await getTestDb().insert(siteSetting).values({}).returning();
    siteSettingId = row.id;
    await getTestDb()
      .insert(siteSettingTranslation)
      .values([
        { siteSettingId, locale: 'ru', title: 'Портфолио', description: 'Описание' },
        { siteSettingId, locale: 'en', title: 'Portfolio', description: 'Description' },
      ]);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('get() returns the singleton row with both translations', async () => {
    const result = await repository.get();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(siteSettingId);
    expect(result!.translations.ru?.title).toBe('Портфолио');
    expect(result!.translations.en?.title).toBe('Portfolio');
  });

  it('update() upserts both translations, including the SEO fallback fields', async () => {
    const updated = await repository.update({
      ru: { title: 'Портфолио', description: 'Описание', defaultSeoTitle: 'SEO по умолчанию' },
      en: { title: 'Portfolio', description: 'Description', defaultSeoTitle: 'Default SEO' },
    });

    expect(updated.translations.ru?.defaultSeoTitle).toBe('SEO по умолчанию');
    expect(updated.translations.en?.defaultSeoTitle).toBe('Default SEO');

    const reread = await repository.get();
    expect(reread!.translations.en?.defaultSeoTitle).toBe('Default SEO');
  });
});
