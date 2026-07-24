import { LOCALES, Locale } from '@/interfaces/locale.type';
import { About } from '../../domain/entities/about.entity';
import { AboutAdminDto, AboutDto, AboutTranslationDto } from '../dtos/about.dto';

export class AboutMapper {
  static toDto(entity: About, locale: Locale): AboutDto {
    const translation = entity.translations[locale] ?? entity.translations.ru ?? entity.translations.en;
    return {
      id: entity.id,
      locale,
      bio: translation?.bio ?? '',
    };
  }

  static toAdminDto(entity: About): AboutAdminDto {
    return {
      id: entity.id,
      translations: LOCALES.filter((locale) => entity.translations[locale]).map((locale): AboutTranslationDto => ({
        ...entity.translations[locale]!,
        locale,
      })),
    };
  }
}
