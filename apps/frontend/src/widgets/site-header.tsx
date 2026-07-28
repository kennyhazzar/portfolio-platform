import Link from "next/link";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { MobileNav } from "@/widgets/mobile-nav";
import { getSiteSetting } from "@/entities/site-setting/api";
import { getHero } from "@/entities/hero/api";
import { getPublicCover } from "@/entities/file/api";
import { getNavigationItems } from "@/entities/navigation/api";
import type { Dictionary } from "@/shared/i18n/dictionary";
import type { SupportedLocale } from "@/middleware";

/** Site brand shown here is admin-managed: avatar from Hero's photo, label from Site Settings' brandName (falls back to title). */
function localizeNavigationUrl(url: string, locale: SupportedLocale) {
  if (url.startsWith("#")) return `/${locale}${url}`;
  if (url.startsWith("/#")) return `/${locale}${url.slice(1)}`;
  if (!url.startsWith("/")) return url;
  if (url === "/") return `/${locale}`;
  if (url.startsWith("/ru/") || url === "/ru" || url.startsWith("/en/") || url === "/en") return url;
  return `/${locale}${url}`;
}

export async function SiteHeader({ locale, dict }: { locale: SupportedLocale; dict: Dictionary }) {
  const [siteSetting, hero, navigationItems] = await Promise.all([
    getSiteSetting(locale),
    getHero(locale),
    getNavigationItems(locale),
  ]);
  const avatar = hero ? await getPublicCover(hero.id) : null;
  const brandName = siteSetting?.brandName || siteSetting?.title || "Портфолио";

  const fallbackLinks = [
    { href: `/${locale}/cases`, label: dict.nav.cases },
    { href: `/${locale}/posts`, label: dict.nav.posts },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];
  const links =
    navigationItems.length > 0
      ? navigationItems.map((item) => ({
          href: localizeNavigationUrl(item.url, locale),
          label: item.label,
        }))
      : fallbackLinks;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto grid h-[68px] max-w-[1120px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-7">
        <nav className="hidden items-center gap-7 sm:flex">
          {links.map((link) => (
            <Link key={`${link.href}:${link.label}`} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileNav links={links} />

        <Link href={`/${locale}`} className="col-start-2 flex items-center gap-2 justify-self-center font-mono text-sm font-semibold">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${avatar.id}`} alt={brandName} className="size-6 rounded-full object-cover" />
          ) : (
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {brandName.charAt(0).toUpperCase()}
            </span>
          )}
          {brandName}
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-2 justify-self-end">
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5 font-mono text-xs">
            {(["ru", "en"] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                  l === locale ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
