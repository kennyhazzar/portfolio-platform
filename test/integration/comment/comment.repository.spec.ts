import { eq } from 'drizzle-orm';
import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { userRole, user } from '../../../libs/database/users.schema';
import { CommentRepositoryDrizzle } from '../../../apps/backend/src/modules/comment/infrastructure/repositories/drizzle/comment.repository.drizzle';
import { PostRepositoryDrizzle } from '../../../apps/backend/src/modules/post/infrastructure/repositories/drizzle/post.repository.drizzle';
import { ContentStatus } from '../../../apps/backend/src/enums/content-status.enum';
import { CommentStatus } from '../../../apps/backend/src/enums/comment-status.enum';

const TEST_ROLE_NAME = 'comment-integration-test-role';

describe('CommentRepositoryDrizzle (integration)', () => {
  let repository: CommentRepositoryDrizzle;
  let postRepository: PostRepositoryDrizzle;
  let roleId: string;
  let authorUserId: string;

  beforeAll(async () => {
    await runMigrations();
    repository = new CommentRepositoryDrizzle(getTestDb());
    postRepository = new PostRepositoryDrizzle(getTestDb());
    const [existing] = await getTestDb().select().from(userRole).where(eq(userRole.name, TEST_ROLE_NAME)).limit(1);
    roleId = existing
      ? existing.id
      : (await getTestDb().insert(userRole).values({ name: TEST_ROLE_NAME }).returning())[0].id;
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

  async function publishedPost() {
    const created = await postRepository.create(authorUserId, {
      ru: { title: 'Статья', slug: 'statya', excerpt: 's', body: 'b' },
      en: { title: 'Post', slug: 'post', excerpt: 's', body: 'b' },
    });
    return postRepository.update(created.id, { status: ContentStatus.PUBLISHED });
  }

  it('createForSlug resolves the post by locale-specific slug and lands as PENDING', async () => {
    await publishedPost();

    const created = await repository.createForSlug(
      'ru',
      'statya',
      { authorName: 'Reader', body: 'Nice post!', captchaChallengeId: 'x', captchaAnswer: 'y' },
      'hashed-ip',
    );

    expect(created.status).toBe(CommentStatus.PENDING);
    expect(created.locale).toBe('ru');
  });

  it('a PENDING comment is invisible via findApprovedByPostSlug until approved', async () => {
    await publishedPost();
    const created = await repository.createForSlug(
      'ru',
      'statya',
      { authorName: 'Reader', body: 'Nice post!', captchaChallengeId: 'x', captchaAnswer: 'y' },
      undefined,
    );

    const before = await repository.findApprovedByPostSlug('ru', 'statya', 1, 20);
    expect(before.meta.total).toBe(0);

    await repository.updateStatus(created.id, CommentStatus.APPROVED);

    const after = await repository.findApprovedByPostSlug('ru', 'statya', 1, 20);
    expect(after.data.map((c) => c.id)).toEqual([created.id]);
  });

  it('findAllAdmin filters by status when given, and lists everything when status is undefined', async () => {
    await publishedPost();
    const a = await repository.createForSlug(
      'ru',
      'statya',
      { authorName: 'A', body: 'a', captchaChallengeId: 'x', captchaAnswer: 'y' },
      undefined,
    );
    await repository.updateStatus(a.id, CommentStatus.SPAM);
    await repository.createForSlug(
      'ru',
      'statya',
      { authorName: 'B', body: 'b', captchaChallengeId: 'x', captchaAnswer: 'y' },
      undefined,
    );

    const pendingOnly = await repository.findAllAdmin(CommentStatus.PENDING, 1, 20);
    expect(pendingOnly.meta.total).toBe(1);

    const all = await repository.findAllAdmin(undefined, 1, 20);
    expect(all.meta.total).toBe(2);
  });

  it('delete() soft-deletes — excluded from findById, findAllAdmin, and public reads afterwards', async () => {
    await publishedPost();
    const created = await repository.createForSlug(
      'ru',
      'statya',
      { authorName: 'Reader', body: 'Nice post!', captchaChallengeId: 'x', captchaAnswer: 'y' },
      undefined,
    );
    await repository.updateStatus(created.id, CommentStatus.APPROVED);

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
    expect((await repository.findAllAdmin(undefined, 1, 20)).meta.total).toBe(0);
    expect((await repository.findApprovedByPostSlug('ru', 'statya', 1, 20)).meta.total).toBe(0);
  });
});
