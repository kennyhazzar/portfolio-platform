import { LOCALES, Locale } from '@/interfaces/locale.type';
import { NavigationItem } from '../../domain/entities/navigation-item.entity';
import { NavigationItemAdminDto, NavigationItemDto, NavigationItemTranslationDto } from '../dtos/navigation-item.dto';

export class NavigationItemMapper {
  static toDto(entity: NavigationItem, locale: Locale): NavigationItemDto {
    const translation = entity.translations[locale] ?? entity.translations.ru ?? entity.translations.en;
    return {
      id: entity.id,
      parentId: entity.parentId,
      url: entity.url,
      position: entity.position,
      label: translation?.label ?? '',
    };
  }

  static toAdminDto(entity: NavigationItem): NavigationItemAdminDto {
    return {
      id: entity.id,
      parentId: entity.parentId,
      url: entity.url,
      position: entity.position,
      isVisible: entity.isVisible,
      translations: LOCALES.filter((locale) => entity.translations[locale]).map(
        (locale): NavigationItemTranslationDto => ({ ...entity.translations[locale]!, locale }),
      ),
    };
  }
}
