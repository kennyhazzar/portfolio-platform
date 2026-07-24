import { Case } from '../../domain/entities/case.entity';
import { CaseMapper } from './case.mapper';

describe('CaseMapper', () => {
  const entity = new Case({
    id: 'case-id',
    status: 'PUBLISHED' as any,
    position: 0,
    viewCount: 5,
    technologies: [{ id: 'tech-id', name: 'TypeScript', category: 'LANGUAGE' as any }],
    translations: {
      ru: { locale: 'ru', title: 'Мой проект', slug: 'moi-proekt', summary: 'Кратко', body: 'Текст' },
      en: { locale: 'en', title: 'My Project', slug: 'my-project', summary: 'Short', body: 'Text' },
    },
  });

  it('toDto flattens the requested locale and includes the sibling slug as an alternate', () => {
    const dto = CaseMapper.toDto(entity, 'ru');
    expect(dto.slug).toBe('moi-proekt');
    expect(dto.title).toBe('Мой проект');
    expect(dto.alternates).toEqual({ en: 'my-project' });
    expect(dto.technologies).toHaveLength(1);
  });

  it('alternates omits locales with no translation at all', () => {
    const partial = new Case({
      id: 'case-id',
      status: 'DRAFT' as any,
      position: 0,
      viewCount: 0,
      technologies: [],
      translations: { ru: { locale: 'ru', title: 'Т', slug: 's', summary: 's', body: 'b' } },
    });
    expect(CaseMapper.toDto(partial, 'ru').alternates).toEqual({});
  });

  it('toAdminDto returns technologyIds and all translations', () => {
    const dto = CaseMapper.toAdminDto(entity);
    expect(dto.technologyIds).toEqual(['tech-id']);
    expect(dto.translations.map((t) => t.locale).sort()).toEqual(['en', 'ru']);
  });
});
