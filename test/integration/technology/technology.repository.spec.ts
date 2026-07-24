import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { TechnologyRepositoryDrizzle } from '../../../apps/backend/src/modules/technology/infrastructure/repositories/drizzle/technology.repository.drizzle';
import { TechnologyCategory } from '../../../apps/backend/src/enums/technology-category.enum';

describe('TechnologyRepositoryDrizzle (integration)', () => {
  let repository: TechnologyRepositoryDrizzle;

  beforeAll(async () => {
    await runMigrations();
    repository = new TechnologyRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('creates, lists (ordered by position), updates, and deletes a technology', async () => {
    const ts = await repository.create({ name: 'TypeScript', category: TechnologyCategory.LANGUAGE, position: 1 });
    const nest = await repository.create({ name: 'NestJS', category: TechnologyCategory.FRAMEWORK, position: 0 });

    const page = await repository.findAll(1, 20);
    expect(page.meta.total).toBe(2);
    expect(page.data.map((t) => t.name)).toEqual(['NestJS', 'TypeScript']); // ordered by position asc

    const updated = await repository.update(ts.id, { name: 'TypeScript (updated)' });
    expect(updated.name).toBe('TypeScript (updated)');

    await repository.delete(nest.id);
    expect(await repository.findById(nest.id)).toBeNull();
  });

  it('reorder() updates positions for multiple rows in one transaction', async () => {
    const a = await repository.create({ name: 'A', position: 0 });
    const b = await repository.create({ name: 'B', position: 1 });

    await repository.reorder([
      { id: a.id, position: 5 },
      { id: b.id, position: 1 },
    ]);

    const page = await repository.findAll(1, 20);
    expect(page.data.map((t) => t.name)).toEqual(['B', 'A']);
  });
});
