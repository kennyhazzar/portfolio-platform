"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/dictionary";
import type { SupportedLocale } from "@/middleware";

export function MobileNav({ locale, dict }: { locale: SupportedLocale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/cases`, label: dict.nav.cases },
    { href: `/${locale}/posts`, label: dict.nav.posts },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    <div className="sm:hidden">
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

      {open && (
        <nav className="absolute inset-x-0 top-[68px] z-30 flex flex-col border-b border-border bg-background/95 px-7 py-3 backdrop-blur-md">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-[8px] px-2 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
