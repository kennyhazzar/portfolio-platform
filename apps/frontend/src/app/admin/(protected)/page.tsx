import Link from "next/link";
import { getHeroAdmin } from "@/entities/hero/admin-api";
import { getAboutAdmin } from "@/entities/about/admin-api";
import { getSiteSettingAdmin } from "@/entities/site-setting/admin-api";
import { getTechnologiesAdmin } from "@/entities/technology/admin-api";
import { getNavigationItemsAdmin } from "@/entities/navigation/admin-api";
import { getContactsAdmin } from "@/entities/contact/admin-api";
import { getCasesAdmin } from "@/entities/case/admin-api";
import { getPostsAdmin } from "@/entities/post/admin-api";
import { getCommentsAdmin } from "@/entities/comment/admin-api";

function StatCard({
  label,
  value,
  breakdown,
  href,
  highlight,
}: {
  label: string;
  value: number;
  breakdown?: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`flex flex-col gap-1.5 rounded-[10px] border p-4 transition-colors ${
        highlight && value > 0 ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      } ${href ? "hover:border-[var(--brand-accent-soft-border)]" : ""}`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
      <span className="font-heading text-3xl font-bold tabular-nums tracking-tight">{value}</span>
      {breakdown && <span className="text-xs text-[var(--brand-text-faint)]">{breakdown}</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function StatusRow({ label, ok, href }: { label: string; ok: boolean; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 transition-colors hover:border-[var(--brand-accent-soft-border)]"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        }`}
      >
        {ok ? "Настроено" : "Не настроено"}
      </span>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [hero, about, siteSetting, technologies, navigationItems, contacts, cases, posts, pending, approved, rejected, spam] =
    await Promise.all([
      getHeroAdmin(),
      getAboutAdmin(),
      getSiteSettingAdmin(),
      getTechnologiesAdmin(),
      getNavigationItemsAdmin(),
      getContactsAdmin(),
      getCasesAdmin(1, 100),
      getPostsAdmin(1, 100),
      getCommentsAdmin("PENDING", 1, 1),
      getCommentsAdmin("APPROVED", 1, 1),
      getCommentsAdmin("REJECTED", 1, 1),
      getCommentsAdmin("SPAM", 1, 1),
    ]);

  const casesPublished = cases.filter((c) => c.status === "PUBLISHED").length;
  const casesDraft = cases.filter((c) => c.status === "DRAFT").length;
  const postsPublished = posts.filter((p) => p.status === "PUBLISHED").length;
  const postsDraft = posts.filter((p) => p.status === "DRAFT").length;
  const totalViews =
    cases.reduce((sum, c) => sum + c.viewCount, 0) + posts.reduce((sum, p) => sum + p.viewCount, 0);
  const pendingCount = pending.meta?.total ?? 0;
  const commentsTotal =
    (pending.meta?.total ?? 0) + (approved.meta?.total ?? 0) + (rejected.meta?.total ?? 0) + (spam.meta?.total ?? 0);

  return (
    <div className="mx-auto max-w-[960px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Панель управления</h1>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Кейсы"
          value={cases.length}
          breakdown={`${casesPublished} опубликовано, ${casesDraft} черновиков`}
          href="/admin/cases"
        />
        <StatCard
          label="Статьи"
          value={posts.length}
          breakdown={`${postsPublished} опубликовано, ${postsDraft} черновиков`}
          href="/admin/posts"
        />
        <StatCard label="Просмотры" value={totalViews} breakdown="кейсы + статьи, суммарно" />
        <StatCard
          label="Комментарии на модерации"
          value={pendingCount}
          breakdown={`${commentsTotal} всего`}
          href="/admin/comments"
          highlight
        />
        <StatCard label="Технологии" value={technologies.length} href="/admin/technology" />
        <StatCard label="Контакты" value={contacts.length} href="/admin/contacts" />
        <StatCard label="Пункты навигации" value={navigationItems.length} href="/admin/navigation" />
      </div>

      <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        Состояние контента
      </h2>
      <div className="flex flex-col gap-2">
        <StatusRow label="Hero" ok={!!hero} href="/admin/hero" />
        <StatusRow label="Обо мне" ok={!!about} href="/admin/about" />
        <StatusRow label="Настройки сайта" ok={!!siteSetting} href="/admin/site-settings" />
      </div>
    </div>
  );
}
