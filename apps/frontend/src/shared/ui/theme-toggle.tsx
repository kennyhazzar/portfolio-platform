"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoids a hydration mismatch: the server always renders the default (dark) icon,
  // the real value is only known once mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Legitimate hydration-safety pattern (next-themes' own recommended approach): the
    // resolved theme is only known client-side, so the first client render must match the
    // server's output, then update once mounted. Not a cascading-render antipattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
