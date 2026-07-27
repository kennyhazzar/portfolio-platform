'use client';

import { useState } from 'react';

export function TechIcon({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-3.5 object-contain" onError={() => setFailed(true)} />
    </span>
  );
}
