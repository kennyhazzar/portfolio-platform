import Link from "next/link";
import { TypewriterText } from "@/shared/ui/typewriter-text";
import type { SupportedLocale } from "@/middleware";

interface HeroData {
  name: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function HeroSection({
  hero,
  photoId,
  locale,
}: {
  hero: HeroData | null;
  photoId?: string | null;
  locale: SupportedLocale;
}) {
  if (!hero) return null;

  const initials = hero.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const headlinePhrases = (hero.headline ?? "")
    .split(/\r?\n|\|/)
    .map((phrase) => phrase.trim())
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden border-b border-border py-14 sm:py-[88px]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--brand-accent-soft-bg), transparent 70%)" }}
      />
      <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-7 text-center">
        {photoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${photoId}`}
            alt={hero.name}
            className="mb-6 size-[84px] rounded-full border border-[var(--brand-border-strong)] object-cover"
          />
        ) : (
          <div className="mb-6 grid size-[84px] place-items-center rounded-full border border-[var(--brand-border-strong)] bg-card font-mono text-2xl font-semibold text-[var(--brand-text-faint)]">
            {initials}
          </div>
        )}
        {headlinePhrases.length > 0 && (
          <div className="mb-4 min-h-[1.55rem] max-w-full font-mono text-base leading-none font-semibold text-primary sm:min-h-[1.85rem] sm:text-lg">
            <TypewriterText phrases={headlinePhrases} />
          </div>
        )}
        <h1 className="mb-4 max-w-[16ch] font-heading text-5xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
          {hero.name}
        </h1>
        {hero.description && (
          <p className="mb-8 max-w-[46ch] text-lg text-muted-foreground">{hero.description}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={hero.ctaUrl ?? `/${locale}#cases`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            {hero.ctaLabel ?? "→"}
          </Link>
          <Link
            href={`/${locale}#posts`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border-strong)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {locale === "ru" ? "Читать блог" : "Read the blog"}
          </Link>
        </div>
      </div>
    </section>
  );
}
