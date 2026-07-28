"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/about", label: "Обо мне" },
  { href: "/admin/site-settings", label: "Настройки сайта" },
  { href: "/admin/cases", label: "Кейсы" },
  { href: "/admin/posts", label: "Посты" },
  { href: "/admin/technology", label: "Технологии" },
  { href: "/admin/navigation", label: "Навигация" },
  { href: "/admin/contacts", label: "Контакты" },
  { href: "/admin/comments", label: "Комментарии" },
];

function PublicSiteLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/ru"
      onClick={onClick}
      target="_blank"
      className="rounded-[8px] border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      Открыть сайт
    </Link>
  );
}

function Logo() {
  return (
    <Link href="/admin" className="flex items-center gap-2 font-mono text-sm font-semibold">
      <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        P
      </span>
      admin
    </Link>
  );
}

/**
 * Below lg, a 220px fixed sidebar next to content leaves too little room for actual content
 * (and this nav has 10 items with long labels) — switch to a top bar + slide-down drawer instead
 * of just shrinking the same layout.
 */
export function AdminSidebar({ userLabel }: { userLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile / tablet: top bar with a hamburger-triggered drawer */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur-md lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </header>
      {open && (
        <nav className="fixed inset-x-0 top-14 z-20 flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto border-b border-border bg-background px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <PublicSiteLink onClick={() => setOpen(false)} />
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[8px] px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-[var(--brand-text-faint)]">{userLabel}</span>
            <LogoutButton />
          </div>
        </nav>
      )}

      {/* Desktop: fixed sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col justify-between border-r border-border p-5 lg:flex">
        <div className="flex flex-col gap-6">
          <Logo />
          <PublicSiteLink />
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[8px] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs text-[var(--brand-text-faint)]">{userLabel}</span>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
