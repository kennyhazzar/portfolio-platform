import { eq } from 'drizzle-orm';
import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { userRole, user } from '../../../libs/database/users.schema';
import { PostRepositoryDrizzle } from '../../../apps/backend/src/modules/post/infrastructure/repositories/drizzle/post.repository.drizzle';
import { ContentStatus } from '../../../apps/backend/src/enums/content-status.enum';

const TEST_ROLE_NAME = 'post-integration-test-role';

describe('PostRepositoryDrizzle (integration)', () => {
  let repository: PostRepositoryDrizzle;
  let authorUserId: string;
  let roleId: string;

  beforeAll(async () => {
    await runMigrations();
    repository = new PostRepositoryDrizzle(getTestDb());
    // user_role is deliberately excluded from truncateAll() (seed-only table, persists across
    // test runs) — this must be idempotent rather than assuming a fresh database.
    const [existing] = await getTestDb().select().from(userRole).where(eq(userRole.name, TEST_ROLE_NAME)).limit(1);
    if (existing) {
      roleId = existing.id;
    } else {
      const [role] = await getTestDb().insert(userRole).values({ name: TEST_ROLE_NAME }).returning();
      roleId = role.id;
    }
  });

  beforeEach(async () => {
    await truncateAll();
    const [author] = await getTestDb()
      .insert(user)
      .values({ email: 'author@example.com', name: 'A', surname: 'B', roleId })
      .returning();
    authorUserId = author.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('creates a DRAFT post authored by the given user, invisible to public reads', async () => {
    const created = await repository.create(authorUserId, {
      ru: { title: 'Статья', slug: 'statya', excerpt: 'Кратко', body: 'Текст' },
      en: { title: 'Post', slug: 'post', excerpt: 'Short', body: 'Text' },
    });

    expect(created.status).toBe(ContentStatus.DRAFT);
    expect(created.authorUserId).toBe(authorUserId);
    expect(await repository.findPublishedBySlug('ru', 'statya')).toBeNull();
  });

  it('publishing sets publishedAt and both locale slugs become resolvable, ordered newest-first', async () => {
    const older = await repository.create(authorUserId, {
      ru: { title: 'Первая', slug: 'first', excerpt: 's', body: 'b' },
      en: { title: 'First', slug: 'first-en', excerpt: 's', body: 'b' },
    });
    const newer = await repository.create(authorUserId, {
      ru: { title: 'Вторая', slug: 'second', excerpt: 's', body: 'b' },
      en: { title: 'Second', slug: 'second-en', excerpt: 's', body: 'b' },
    });
    await repository.update(older.id, { status: ContentStatus.PUBLISHED });
    // ensure a distinct publishedAt ordering
    await new Promise((resolve) => setTimeout(resolve, 10));
    await repository.update(newer.id, { status: ContentStatus.PUBLISHED });

    const page = await repository.findPublished(1, 20);
    expect(page.data.map((p) => p.id)).toEqual([newer.id, older.id]);

    const bySlug = await repository.findPublishedBySlug('en', 'second-en');
    expect(bySlug!.translations.ru?.slug).toBe('second');
  });

  it('delete() soft-deletes — excluded from admin and public reads afterwards', async () => {
    const created = await repository.create(authorUserId, {
      ru: { title: 'Т', slug: 's-ru', excerpt: 's', body: 'b' },
      en: { title: 'T', slug: 's-en', excerpt: 's', body: 'b' },
    });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
    const adminPage = await repository.findAllAdmin(1, 20);
    expect(adminPage.meta.total).toBe(0);
  });
});
