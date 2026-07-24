import { LOCALES, Locale } from '@/interfaces/locale.type';
import { Case } from '../../domain/entities/case.entity';
import { CaseAdminDto, CaseDto, CaseTranslationDto } from '../dtos/case.dto';

export class CaseMapper {
  static toDto(entity: Case, locale: Locale): CaseDto {
    const translation = entity.translations[locale] ?? entity.translations.ru ?? entity.translations.en;
    const alternates: Partial<Record<Locale, string>> = {};
    for (const l of LOCALES) {
      if (l !== locale && entity.translations[l]) alternates[l] = entity.translations[l].slug;
    }
    return {
      id: entity.id,
      locale,
      slug: translation?.slug ?? '',
      title: translation?.title ?? '',
      summary: translation?.summary ?? '',
      body: translation?.body ?? '',
      seoTitle: translation?.seoTitle,
      seoDescription: translation?.seoDescription,
      repoUrl: entity.repoUrl,
      liveUrl: entity.liveUrl,
      publishedAt: entity.publishedAt,
      viewCount: entity.viewCount,
      technologies: entity.technologies,
      alternates,
    };
  }

  static toAdminDto(entity: Case): CaseAdminDto {
    return {
      id: entity.id,
      status: entity.status,
      publishedAt: entity.publishedAt,
      position: entity.position,
      repoUrl: entity.repoUrl,
      liveUrl: entity.liveUrl,
      viewCount: entity.viewCount,
      technologyIds: entity.technologies.map((t) => t.id),
      translations: LOCALES.filter((locale) => entity.translations[locale]).map((locale): CaseTranslationDto => ({
        ...entity.translations[locale]!,
        locale,
      })),
    };
  }
}
