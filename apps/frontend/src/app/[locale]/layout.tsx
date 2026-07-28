import type { Metadata } from 'next';
import { ThemeProvider } from '@/shared/ui/theme-provider';
import { displayFont, sansFont, monoFont } from '@/shared/ui/fonts';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/middleware';
import { SITE_NAME, SITE_URL } from '@/shared/seo/metadata';
import '../globals.css';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s - ${SITE_NAME}`,
  },
  description: 'Personal website of a backend/fullstack engineer.',
  applicationName: SITE_NAME,
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  keywords: [
    'backend engineer',
    'fullstack developer',
    'NestJS',
    'Next.js',
    'TypeScript',
    'DDD',
    'CQRS',
    'Clean Architecture',
  ],
  authors: [{ name: 'Kenny Hazzar', url: SITE_URL }],
  creator: 'Kenny Hazzar',
  publisher: 'Kenny Hazzar',
  category: 'technology',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.svg',
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: SupportedLocale };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
