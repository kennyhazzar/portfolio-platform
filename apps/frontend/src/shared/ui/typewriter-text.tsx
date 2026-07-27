"use client";

import { useEffect, useMemo, useState } from "react";

export function TypewriterText({ phrases }: { phrases: string[] }) {
  const normalized = useMemo(() => phrases.map((p) => p.trim()).filter(Boolean), [phrases]);
  const longestPhrase = useMemo(
    () => normalized.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), ""),
    [normalized],
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (normalized.length === 0) return;

    const current = normalized[phraseIndex] ?? "";
    const doneTyping = !deleting && visibleChars >= current.length;
    const doneDeleting = deleting && visibleChars === 0;
    const delay = doneTyping ? 1300 : deleting ? 32 : 54;

    const timer = window.setTimeout(() => {
      if (doneTyping) {
        setDeleting(true);
        return;
      }
      if (doneDeleting) {
        setDeleting(false);
        setPhraseIndex((index) => (index + 1) % normalized.length);
        return;
      }
      setVisibleChars((count) => count + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deleting, normalized, phraseIndex, visibleChars]);

  if (normalized.length === 0) return null;

  const current = normalized[phraseIndex] ?? "";

  return (
    <span className="inline-grid max-w-full grid-cols-[minmax(0,auto)] items-center justify-items-center">
      <span aria-hidden className="invisible col-start-1 row-start-1 inline-flex whitespace-pre-wrap">
        <span>{longestPhrase}</span>
        <span className="ml-1 w-[2px] shrink-0" />
      </span>
      <span className="col-start-1 row-start-1 inline-flex min-h-[1.35em] max-w-full items-center justify-center whitespace-pre-wrap">
        <span>{current.slice(0, visibleChars)}</span>
        <span aria-hidden className="ml-1 h-[1.1em] w-[2px] shrink-0 animate-pulse bg-primary" />
      </span>
    </span>
  );
}
