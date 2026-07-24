import { runMigrations, getTestDb, truncateAll, closeTestDb } from '../../setup/database';
import { hero, heroTranslation } from '../../../apps/backend/src/common/drizzle/schema';
import { HeroRepositoryDrizzle } from '../../../apps/backend/src/modules/hero/infrastructure/repositories/drizzle/hero.repository.drizzle';

describe('HeroRepositoryDrizzle (integration)', () => {
  let repository: HeroRepositoryDrizzle;
  let heroId: string;

  beforeAll(async () => {
    await runMigrations();
    repository = new HeroRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
    const [row] = await getTestDb().insert(hero).values({}).returning();
    heroId = row.id;
    await getTestDb()
      .insert(heroTranslation)
      .values([
        { heroId, locale: 'ru', name: 'Имя' },
        { heroId, locale: 'en', name: 'Name' },
      ]);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('get() returns the singleton row with both translations', async () => {
    const result = await repository.get();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(heroId);
    expect(result!.translations.ru?.name).toBe('Имя');
    expect(result!.translations.en?.name).toBe('Name');
  });

  it('update() upserts both translations and the ctaUrl in one transaction', async () => {
    const updated = await repository.update({
      ctaUrl: '/cases',
      ru: { name: 'Новое имя', headline: 'Инженер' },
      en: { name: 'New name', headline: 'Engineer' },
    });

    expect(updated.ctaUrl).toBe('/cases');
    expect(updated.translations.ru?.name).toBe('Новое имя');
    expect(updated.translations.en?.headline).toBe('Engineer');

    const reread = await repository.get();
    expect(reread!.translations.ru?.name).toBe('Новое имя');
  });
});
