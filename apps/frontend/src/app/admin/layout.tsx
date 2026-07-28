import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { sansFont, monoFont } from "@/shared/ui/fonts";
import { SITE_URL } from "@/shared/seo/metadata";
import "../globals.css";

// Admin is a single-operator tool, not localized content, so it isn't nested under [locale]
// (docs/planning/04-frontend-architecture.md §1) — this is its own root layout. It uses the
// body/mono fonts but skips the display font (Unbounded), reserved for the public site's
// headline moments.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Admin — Портфолио",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
