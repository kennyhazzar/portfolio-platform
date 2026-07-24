import { runMigrations, truncateAll, getTestDb, closeTestDb } from '../../setup/database';
import { CaseRepositoryDrizzle } from '../../../apps/backend/src/modules/case/infrastructure/repositories/drizzle/case.repository.drizzle';
import { TechnologyRepositoryDrizzle } from '../../../apps/backend/src/modules/technology/infrastructure/repositories/drizzle/technology.repository.drizzle';
import { ContentStatus } from '../../../apps/backend/src/enums/content-status.enum';

describe('CaseRepositoryDrizzle (integration)', () => {
  let repository: CaseRepositoryDrizzle;
  let technologyRepository: TechnologyRepositoryDrizzle;

  beforeAll(async () => {
    await runMigrations();
    repository = new CaseRepositoryDrizzle(getTestDb());
    technologyRepository = new TechnologyRepositoryDrizzle(getTestDb());
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('creates a DRAFT case with technologies and both translations', async () => {
    const ts = await technologyRepository.create({ name: 'TypeScript' });

    const created = await repository.create({
      technologyIds: [ts.id],
      ru: { title: 'Мой проект', slug: 'moi-proekt', summary: 'Кратко', body: 'Текст' },
      en: { title: 'My Project', slug: 'my-project', summary: 'Short', body: 'Text' },
    });

    expect(created.status).toBe(ContentStatus.DRAFT);
    expect(created.technologies.map((t) => t.name)).toEqual(['TypeScript']);
    expect(created.translations.ru?.slug).toBe('moi-proekt');
  });

  it('a DRAFT case is invisible to the public findPublished/findPublishedBySlug reads', async () => {
    await repository.create({
      ru: { title: 'Черновик', slug: 'draft-ru', summary: 's', body: 'b' },
      en: { title: 'Draft', slug: 'draft-en', summary: 's', body: 'b' },
    });

    const page = await repository.findPublished(1, 20);
    expect(page.meta.total).toBe(0);
    expect(await repository.findPublishedBySlug('ru', 'draft-ru')).toBeNull();
  });

  it('publishing via update() sets publishedAt and makes the case publicly visible by slug', async () => {
    const created = await repository.create({
      ru: { title: 'Мой проект', slug: 'moi-proekt', summary: 's', body: 'b' },
      en: { title: 'My Project', slug: 'my-project', summary: 's', body: 'b' },
    });
    expect(created.publishedAt).toBeUndefined();

    const published = await repository.update(created.id, { status: ContentStatus.PUBLISHED });
    expect(published.status).toBe(ContentStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);

    const bySlugRu = await repository.findPublishedBySlug('ru', 'moi-proekt');
    expect(bySlugRu).not.toBeNull();
    expect(bySlugRu!.translations.en?.slug).toBe('my-project'); // both locales present for hreflang/alternates

    const bySlugEn = await repository.findPublishedBySlug('en', 'my-project');
    expect(bySlugEn!.id).toBe(created.id);
  });

  it('update() replaces the technology set when technologyIds is provided', async () => {
    const tsTech = await technologyRepository.create({ name: 'TypeScript' });
    const nestTech = await technologyRepository.create({ name: 'NestJS' });
    const created = await repository.create({
      technologyIds: [tsTech.id],
      ru: { title: 'Т', slug: 's-ru', summary: 's', body: 'b' },
      en: { title: 'T', slug: 's-en', summary: 's', body: 'b' },
    });

    const updated = await repository.update(created.id, { technologyIds: [nestTech.id] });

    expect(updated.technologies.map((t) => t.name)).toEqual(['NestJS']);
  });

  it('delete() soft-deletes — the row is excluded from admin and public reads afterwards', async () => {
    const created = await repository.create({
      ru: { title: 'Т', slug: 's-ru', summary: 's', body: 'b' },
      en: { title: 'T', slug: 's-en', summary: 's', body: 'b' },
    });

    await repository.delete(created.id);

    expect(await repository.findById(created.id)).toBeNull();
    const adminPage = await repository.findAllAdmin(1, 20);
    expect(adminPage.meta.total).toBe(0);
  });

  it('reorder() updates positions for multiple cases in one transaction', async () => {
    const a = await repository.create({
      position: 0,
      ru: { title: 'A', slug: 'a', summary: 's', body: 'b' },
      en: { title: 'A', slug: 'a-en', summary: 's', body: 'b' },
    });
    const b = await repository.create({
      position: 1,
      ru: { title: 'B', slug: 'b', summary: 's', body: 'b' },
      en: { title: 'B', slug: 'b-en', summary: 's', body: 'b' },
    });
    await repository.update(a.id, { status: ContentStatus.PUBLISHED });
    await repository.update(b.id, { status: ContentStatus.PUBLISHED });

    await repository.reorder([
      { id: a.id, position: 5 },
      { id: b.id, position: 0 },
    ]);

    const page = await repository.findPublished(1, 20);
    expect(page.data.map((c) => c.id)).toEqual([b.id, a.id]);
  });
});
