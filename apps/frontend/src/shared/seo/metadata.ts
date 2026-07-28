import type { Metadata } from 'next';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/middleware';

const fallbackSiteUrl = 'http://localhost:3000';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl).replace(/\/+$/, '');
export const SITE_NAME = 'kennyhazzar.pro';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SiteSettingLike {
  title: string;
  description: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
}

/**
 * `languageAlternates` maps each supported locale to the full locale-prefixed pathname
 * (e.g. "/ru/cases/foo-ru") so hreflang can point at the actual sibling-locale slug rather
 * than assuming the same slug works across locales.
 */
export function buildMetadata({
  locale,
  siteSetting,
  title,
  description,
  pathname,
  languageAlternates,
}: {
  locale: SupportedLocale;
  siteSetting: SiteSettingLike | null;
  title?: string;
  description?: string;
  pathname: string;
  languageAlternates?: Partial<Record<SupportedLocale, string>>;
}): Metadata {
  const siteName = siteSetting?.title ?? SITE_NAME;
  const resolvedTitle = title ?? siteSetting?.defaultSeoTitle ?? siteName;
  const resolvedDescription = description ?? siteSetting?.defaultSeoDescription ?? siteSetting?.description ?? '';

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const alt = languageAlternates?.[l];
    if (alt) languages[l] = alt;
  }
  if (languageAlternates?.ru) languages['x-default'] = languageAlternates.ru;

  return {
    metadataBase: new URL(SITE_URL),
    title: title ? `${title} - ${siteName}` : resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: pathname,
      languages,
    },
    openGraph: {
      title: title ?? resolvedTitle,
      description: resolvedDescription,
      url: pathname,
      siteName,
      locale,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? resolvedTitle,
      description: resolvedDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
