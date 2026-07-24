import type { Dictionary } from "@/shared/i18n/dictionary";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-7">
        <div className="font-mono text-xs text-[var(--brand-text-faint)]">
          © {new Date().getFullYear()} · {dict.footer.note}
        </div>
        <div className="flex gap-[18px] text-[13px] text-[var(--brand-text-faint)]">
          <a href="/sitemap.xml" className="hover:text-muted-foreground">
            {dict.footer.sitemap}
          </a>
        </div>
      </div>
    </footer>
  );
}
