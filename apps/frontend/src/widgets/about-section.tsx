import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/dictionary";
import type { SupportedLocale } from "@/middleware";

export function AboutSection({
  bio,
  locale,
  dict,
}: {
  bio: string | null;
  locale: SupportedLocale;
  dict: Dictionary;
}) {
  if (!bio) return null;

  return (
    <section id="about" className="border-b border-border py-16">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-start gap-10 px-7 sm:grid-cols-[1fr_auto]">
        <div>
          <h2 className="mb-4 font-heading text-2xl font-bold tracking-tight">{dict.about.title}</h2>
          <p className="max-w-[68ch] text-muted-foreground">{bio}</p>
        </div>
        <Link
          href={`/${locale}/about`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border-strong)] px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-accent"
        >
          {dict.about.full}
        </Link>
      </div>
    </section>
  );
}
