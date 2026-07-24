import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { displayFont, sansFont, monoFont } from "@/shared/ui/fonts";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/middleware";
import { SITE_URL } from "@/shared/seo/metadata";
import "../globals.css";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Портфолио",
  description: "Личный сайт backend/fullstack-инженера.",
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
