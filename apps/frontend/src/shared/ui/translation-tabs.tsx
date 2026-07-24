"use client";

import { useState } from "react";

/**
 * Both locale panels stay mounted at all times (toggled via CSS, not conditional rendering) —
 * unmounting the inactive tab would drop its controlled field state when the admin switches
 * back, since the whole form submits both locales in one request (05-admin-panel.md §1).
 */
export function TranslationTabs({ ru, en }: { ru: React.ReactNode; en: React.ReactNode }) {
  const [active, setActive] = useState<"ru" | "en">("ru");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit gap-0.5 rounded-full border border-border p-0.5 font-mono text-xs">
        {(["ru", "en"] as const).map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActive(locale)}
            className={`rounded-full px-3 py-1 uppercase transition-colors ${
              active === locale ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale}
          </button>
        ))}
      </div>
      <div className={active === "ru" ? "flex flex-col gap-4" : "hidden"}>{ru}</div>
      <div className={active === "en" ? "flex flex-col gap-4" : "hidden"}>{en}</div>
    </div>
  );
}
