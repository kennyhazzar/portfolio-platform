import { runMigrations, getTestDb, truncateAll, closeTestDb } from '../../setup/database';
import { about, aboutTranslation } from '../../../apps/backend/src/common/drizzle/schema';
import { AboutRepositoryDrizzle } from '../../../apps/backend/src/modules/about/infrastructure/repositories/drizzle/about.repository.drizzle';

describe('AboutRepositoryDrizzle (integration)', () => {
  let repository: AboutRepositoryDrizzle;
  let aboutId: string;

  beforeAll(async () => {
    await runMigrations();
    repository = new AboutRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
    const [row] = await getTestDb().insert(about).values({}).returning();
    aboutId = row.id;
    await getTestDb()
      .insert(aboutTranslation)
      .values([
        { aboutId, locale: 'ru', bio: 'Био' },
        { aboutId, locale: 'en', bio: 'Bio' },
      ]);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('get() returns the singleton row with both translations', async () => {
    const result = await repository.get();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(aboutId);
    expect(result!.translations.ru?.bio).toBe('Био');
    expect(result!.translations.en?.bio).toBe('Bio');
  });

  it('update() upserts both translations in one transaction', async () => {
    const updated = await repository.update({
      ru: { bio: 'Новое био' },
      en: { bio: 'New bio' },
    });

    expect(updated.translations.ru?.bio).toBe('Новое био');
    expect(updated.translations.en?.bio).toBe('New bio');

    const reread = await repository.get();
    expect(reread!.translations.en?.bio).toBe('New bio');
  });
});
