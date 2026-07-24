import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/dictionary";
import type { SupportedLocale } from "@/middleware";

interface CaseItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technologies: { id: string; name: string }[];
}

export function CaseGridSection({
  cases,
  coversById = {},
  locale,
  dict,
}: {
  cases: CaseItem[];
  coversById?: Record<string, string | undefined>;
  locale: SupportedLocale;
  dict: Dictionary;
}) {
  return (
    <section id="cases" className="border-b border-border py-16">
      <div className="mx-auto max-w-[1120px] px-7">
        <div className="mb-7 flex items-baseline justify-between gap-5">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{dict.cases.title}</h2>
          {cases.length > 0 && (
            <Link href={`/${locale}/cases`} className="text-sm text-muted-foreground hover:text-primary">
              {dict.cases.viewAll}
            </Link>
          )}
        </div>

        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.cases.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <Link
                key={c.slug}
                href={`/${locale}/cases/${c.slug}`}
                className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-card p-[22px] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-accent-soft-border)]"
              >
                {coversById[c.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${coversById[c.id]}`}
                    alt={c.title}
                    className="h-40 w-full rounded-[8px] object-cover"
                  />
                )}
                <div className="text-base font-bold">{c.title}</div>
                <p className="flex-grow text-sm text-muted-foreground">{c.summary}</p>
                {c.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.technologies.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="font-mono text-[13px] text-primary">{dict.cases.readCase}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
