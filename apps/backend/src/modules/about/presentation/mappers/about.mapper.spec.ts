import { About } from '../../domain/entities/about.entity';
import { AboutMapper } from './about.mapper';

describe('AboutMapper', () => {
  const entity = new About({
    id: 'about-id',
    translations: {
      ru: { locale: 'ru', bio: 'Био' },
      en: { locale: 'en', bio: 'Bio' },
    },
  });

  it('toDto flattens the requested locale', () => {
    expect(AboutMapper.toDto(entity, 'en')).toEqual({ id: 'about-id', locale: 'en', bio: 'Bio' });
  });

  it('toDto falls back to ru when the requested locale has no translation', () => {
    const partial = new About({ id: 'about-id', translations: { ru: { locale: 'ru', bio: 'Био' } } });
    expect(AboutMapper.toDto(partial, 'en').bio).toBe('Био');
  });

  it('toAdminDto returns every translation with its locale attached', () => {
    const dto = AboutMapper.toAdminDto(entity);
    expect(dto.translations.map((t) => t.locale).sort()).toEqual(['en', 'ru']);
  });
});
