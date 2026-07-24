import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { SiteSettingMapper } from './site-setting.mapper';

describe('SiteSettingMapper', () => {
  const entity = new SiteSetting({
    id: 'site-setting-id',
    translations: {
      ru: { locale: 'ru', title: 'Портфолио', description: 'Описание', defaultSeoTitle: 'SEO RU' },
      en: { locale: 'en', title: 'Portfolio', description: 'Description', defaultSeoTitle: 'SEO EN' },
    },
  });

  it('toDto flattens the requested locale', () => {
    const dto = SiteSettingMapper.toDto(entity, 'en');
    expect(dto.title).toBe('Portfolio');
    expect(dto.defaultSeoTitle).toBe('SEO EN');
  });

  it('toDto falls back to ru when the requested locale has no translation', () => {
    const partial = new SiteSetting({
      id: 'site-setting-id',
      translations: { ru: { locale: 'ru', title: 'Портфолио', description: 'Описание' } },
    });
    expect(SiteSettingMapper.toDto(partial, 'en').title).toBe('Портфолио');
  });

  it('toAdminDto returns every translation with its locale attached', () => {
    const dto = SiteSettingMapper.toAdminDto(entity);
    expect(dto.translations.map((t) => t.locale).sort()).toEqual(['en', 'ru']);
  });
});
