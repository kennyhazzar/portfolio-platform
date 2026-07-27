import type { Dictionary } from '@/shared/i18n/dictionary';
import { TechIcon } from '@/widgets/tech-icon';

interface TechnologyItem {
  id: string;
  name: string;
  category: string;
  iconSlug?: string;
}

const CATEGORY_ORDER = [
  'LANGUAGE',
  'FRAMEWORK',
  'LIBRARY',
  'DATABASE',
  'STORAGE',
  'INFRA',
  'PROTOCOL',
  'ARCHITECTURE',
  'AUTH',
  'TESTING',
  'TOOL',
  'OTHER',
] as const;

function iconSrc(iconSlug?: string) {
  if (!iconSlug) return null;
  if (iconSlug.startsWith('http://') || iconSlug.startsWith('https://')) return iconSlug;
  return `https://cdn.simpleicons.org/${encodeURIComponent(iconSlug)}`;
}

export function TechStackSection({ technologies, dict }: { technologies: TechnologyItem[]; dict: Dictionary }) {
  if (technologies.length === 0) return null;

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: technologies.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <section id="stack" className="border-b border-border py-16">
      <div className="mx-auto max-w-[1120px] px-7">
        <h2 className="mb-7 font-heading text-2xl font-bold tracking-tight">{dict.stack.title}</h2>
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div
              key={group.category}
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-4"
            >
              <div className="shrink-0 font-mono text-xs uppercase tracking-[0.06em] text-[var(--brand-text-faint)] sm:w-[84px]">
                {dict.techCategory[group.category as keyof Dictionary['techCategory']] ?? group.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const src = iconSrc(item.iconSlug);
                  return (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[13px] text-muted-foreground"
                    >
                      {src && <TechIcon src={src} />}
                      {item.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
