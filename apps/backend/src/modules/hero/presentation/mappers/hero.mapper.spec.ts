import { Hero } from '../../domain/entities/hero.entity';
import { HeroMapper } from './hero.mapper';

describe('HeroMapper', () => {
  const entity = new Hero({
    id: 'hero-id',
    ctaUrl: '/cases',
    translations: {
      ru: { locale: 'ru', name: 'Имя', headline: 'Инженер' },
      en: { locale: 'en', name: 'Name', headline: 'Engineer' },
    },
  });

  it('toDto flattens the requested locale', () => {
    expect(HeroMapper.toDto(entity, 'en')).toEqual({
      id: 'hero-id',
      ctaUrl: '/cases',
      locale: 'en',
      name: 'Name',
      headline: 'Engineer',
      description: undefined,
      ctaLabel: undefined,
    });
  });

  it('toDto falls back to ru when the requested locale has no translation', () => {
    const partial = new Hero({ id: 'hero-id', translations: { ru: { locale: 'ru', name: 'Имя' } } });
    expect(HeroMapper.toDto(partial, 'en').name).toBe('Имя');
  });

  it('toAdminDto returns every translation with its locale attached', () => {
    const dto = HeroMapper.toAdminDto(entity);
    expect(dto.translations).toHaveLength(2);
    expect(dto.translations.map((t) => t.locale).sort()).toEqual(['en', 'ru']);
  });
});
