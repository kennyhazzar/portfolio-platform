import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { NavigationItemRepositoryDrizzle } from '../../../apps/backend/src/modules/navigation/infrastructure/repositories/drizzle/navigation-item.repository.drizzle';

describe('NavigationItemRepositoryDrizzle (integration)', () => {
  let repository: NavigationItemRepositoryDrizzle;

  beforeAll(async () => {
    await runMigrations();
    repository = new NavigationItemRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('creates an item with both translations and reads it back', async () => {
    const created = await repository.create({
      url: '/cases',
      ru: { label: 'Кейсы' },
      en: { label: 'Cases' },
    });

    expect(created.translations.ru?.label).toBe('Кейсы');
    expect(created.translations.en?.label).toBe('Cases');

    const found = await repository.findById(created.id);
    expect(found!.url).toBe('/cases');
  });

  it('findAll(visibleOnly=true) excludes hidden items and orders by position', async () => {
    const hidden = await repository.create({
      url: '/hidden',
      isVisible: false,
      ru: { label: 'Скрыто' },
      en: { label: 'Hidden' },
    });
    const b = await repository.create({ url: '/b', position: 1, ru: { label: 'Б' }, en: { label: 'B' } });
    const a = await repository.create({ url: '/a', position: 0, ru: { label: 'А' }, en: { label: 'A' } });

    const visible = await repository.findAll(true);
    expect(visible.map((i) => i.url)).toEqual(['/a', '/b']);
    expect(visible.find((i) => i.id === hidden.id)).toBeUndefined();

    const all = await repository.findAll(false);
    expect(all).toHaveLength(3);
    void a;
    void b;
  });

  it('update() can change one translation without touching the other, and delete() removes the row', async () => {
    const created = await repository.create({ url: '/cases', ru: { label: 'Кейсы' }, en: { label: 'Cases' } });

    const updated = await repository.update(created.id, { en: { label: 'Case studies' } });
    expect(updated.translations.en?.label).toBe('Case studies');
    expect(updated.translations.ru?.label).toBe('Кейсы');

    await repository.delete(created.id);
    expect(await repository.findById(created.id)).toBeNull();
  });

  it('reorder() updates positions for multiple rows in one transaction', async () => {
    const a = await repository.create({ url: '/a', position: 0, ru: { label: 'А' }, en: { label: 'A' } });
    const b = await repository.create({ url: '/b', position: 1, ru: { label: 'Б' }, en: { label: 'B' } });

    await repository.reorder([
      { id: a.id, position: 5 },
      { id: b.id, position: 0 },
    ]);

    const items = await repository.findAll(false);
    expect(items.map((i) => i.url)).toEqual(['/b', '/a']);
  });
});
