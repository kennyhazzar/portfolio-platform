import { LOCALES, Locale } from '@/interfaces/locale.type';
import { SiteSetting } from '../../domain/entities/site-setting.entity';
import { SiteSettingAdminDto, SiteSettingDto, SiteSettingTranslationDto } from '../dtos/site-setting.dto';

export class SiteSettingMapper {
  static toDto(entity: SiteSetting, locale: Locale): SiteSettingDto {
    const translation = entity.translations[locale] ?? entity.translations.ru ?? entity.translations.en;
    return {
      id: entity.id,
      locale,
      title: translation?.title ?? '',
      brandName: translation?.brandName,
      description: translation?.description ?? '',
      footerText: translation?.footerText,
      copyrightText: translation?.copyrightText,
      defaultSeoTitle: translation?.defaultSeoTitle,
      defaultSeoDescription: translation?.defaultSeoDescription,
    };
  }

  static toAdminDto(entity: SiteSetting): SiteSettingAdminDto {
    return {
      id: entity.id,
      translations: LOCALES.filter((locale) => entity.translations[locale]).map(
        (locale): SiteSettingTranslationDto => ({ ...entity.translations[locale]!, locale }),
      ),
    };
  }
}
