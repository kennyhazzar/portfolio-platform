import { LOCALES, Locale } from '@/interfaces/locale.type';
import { Hero } from '../../domain/entities/hero.entity';
import { HeroAdminDto, HeroDto, HeroTranslationDto } from '../dtos/hero.dto';

export class HeroMapper {
  static toDto(entity: Hero, locale: Locale): HeroDto {
    const translation = entity.translations[locale] ?? entity.translations.ru ?? entity.translations.en;
    return {
      id: entity.id,
      ctaUrl: entity.ctaUrl,
      locale,
      name: translation?.name ?? '',
      headline: translation?.headline,
      description: translation?.description,
      ctaLabel: translation?.ctaLabel,
    };
  }

  static toAdminDto(entity: Hero): HeroAdminDto {
    return {
      id: entity.id,
      ctaUrl: entity.ctaUrl,
      translations: LOCALES.filter((locale) => entity.translations[locale]).map((locale): HeroTranslationDto => ({
        ...entity.translations[locale]!,
        locale,
      })),
    };
  }
}
