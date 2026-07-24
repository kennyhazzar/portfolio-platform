import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { ContactRepositoryDrizzle } from '../../../apps/backend/src/modules/contact/infrastructure/repositories/drizzle/contact.repository.drizzle';
import { ContactPlatform } from '../../../apps/backend/src/enums/contact-platform.enum';

describe('ContactRepositoryDrizzle (integration)', () => {
  let repository: ContactRepositoryDrizzle;

  beforeAll(async () => {
    await runMigrations();
    repository = new ContactRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('creates, lists (ordered by position), updates, and deletes a contact', async () => {
    const github = await repository.create({ platform: ContactPlatform.GITHUB, value: 'gh', position: 1 });
    const telegram = await repository.create({ platform: ContactPlatform.TELEGRAM, value: 'tg', position: 0 });

    const all = await repository.findAll(false);
    expect(all.map((c) => c.value)).toEqual(['tg', 'gh']);

    const updated = await repository.update(github.id, { value: 'gh-updated' });
    expect(updated.value).toBe('gh-updated');

    await repository.delete(telegram.id);
    expect(await repository.findById(telegram.id)).toBeNull();
  });

  it('findAll(visibleOnly=true) excludes hidden contacts', async () => {
    await repository.create({ platform: ContactPlatform.EMAIL, value: 'hidden@example.com', isVisible: false });
    const visible = await repository.create({ platform: ContactPlatform.GITHUB, value: 'gh' });

    const result = await repository.findAll(true);

    expect(result.map((c) => c.id)).toEqual([visible.id]);
  });

  it('reorder() updates positions for multiple rows in one transaction', async () => {
    const a = await repository.create({ platform: ContactPlatform.GITHUB, value: 'a', position: 0 });
    const b = await repository.create({ platform: ContactPlatform.TELEGRAM, value: 'b', position: 1 });

    await repository.reorder([
      { id: a.id, position: 5 },
      { id: b.id, position: 0 },
    ]);

    const all = await repository.findAll(false);
    expect(all.map((c) => c.id)).toEqual([b.id, a.id]);
  });
});
