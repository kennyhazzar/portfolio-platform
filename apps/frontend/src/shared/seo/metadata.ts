import type { Metadata } from "next";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/middleware";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  const siteName = siteSetting?.title ?? "Портфолио";
  const resolvedTitle = title ?? siteSetting?.defaultSeoTitle ?? siteName;
  const resolvedDescription =
    description ?? siteSetting?.defaultSeoDescription ?? siteSetting?.description ?? "";

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const alt = languageAlternates?.[l];
    if (alt) languages[l] = alt;
  }

  return {
    title: title ? `${title} — ${siteName}` : resolvedTitle,
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
      type: "website",
    },
  };
}
