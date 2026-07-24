import { NavigationItem } from '../../domain/entities/navigation-item.entity';
import { NavigationItemMapper } from './navigation-item.mapper';

describe('NavigationItemMapper', () => {
  const entity = new NavigationItem({
    id: 'nav-id',
    url: '/cases',
    position: 0,
    isVisible: true,
    translations: { ru: { locale: 'ru', label: 'Кейсы' }, en: { locale: 'en', label: 'Cases' } },
  });

  it('toDto flattens the requested locale', () => {
    expect(NavigationItemMapper.toDto(entity, 'en')).toEqual({
      id: 'nav-id',
      parentId: undefined,
      url: '/cases',
      position: 0,
      label: 'Cases',
    });
  });

  it('toAdminDto returns every translation with isVisible', () => {
    const dto = NavigationItemMapper.toAdminDto(entity);
    expect(dto.isVisible).toBe(true);
    expect(dto.translations.map((t) => t.locale).sort()).toEqual(['en', 'ru']);
  });
});
