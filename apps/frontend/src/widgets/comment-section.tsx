'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dictionary } from '@/shared/i18n/dictionary';
import type { SupportedLocale } from '@/middleware';
import { formatDate } from '@/shared/lib/format-date';
import type { CommentTargetType } from '@/entities/comment/api';

interface CommentItem {
  id: string;
  authorName: string;
  authorUrl?: string;
  body: string;
  createdAt: string;
}

interface CreateCommentResponse extends CommentItem {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
}

interface Challenge {
  challengeId: string;
  imageUrl: string;
}

export function CommentSection({
  slug,
  targetType = 'post',
  locale,
  dict,
  initialComments,
}: {
  slug: string;
  targetType?: CommentTargetType;
  locale: SupportedLocale;
  dict: Dictionary;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [body, setBody] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  const fetchChallenge = useCallback(async () => {
    const res = await fetch('/api/captcha', { method: 'POST' });
    if (!res.ok) return;
    const data = (await res.json()) as Challenge;
    setChallenge(data);
    setCaptchaAnswer('');
  }, []);

  useEffect(() => {
    // Fetching an initial captcha challenge from the backend on mount — a real external-system
    // side effect (not derived state), so the setState-in-effect warning doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChallenge();
  }, [fetchChallenge]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setStatus('submitting');

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        targetType,
        locale,
        authorName,
        authorEmail: authorEmail || undefined,
        body,
        captchaChallengeId: challenge.challengeId,
        captchaAnswer,
        website,
      }),
    });

    if (!res.ok) {
      setStatus('error');
      await fetchChallenge();
      return;
    }

    const created = (await res.json()) as CreateCommentResponse;
    setAuthorName('');
    setAuthorEmail('');
    setBody('');
    await fetchChallenge();

    if (created.status === 'APPROVED') {
      setStatus('success');
      setComments((prev) => [...prev, created]);
    } else {
      setStatus('idle');
      setPendingModalOpen(true);
    }
  }

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-[840px] px-7">
        <h2 className="mb-7 font-heading text-2xl font-bold tracking-tight">{dict.comments.title}</h2>

        {comments.length === 0 ? (
          <p className="mb-10 text-sm text-muted-foreground">{dict.comments.empty}</p>
        ) : (
          <div className="mb-10 flex flex-col gap-5">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-border pb-5">
                <div className="mb-1.5 flex items-baseline gap-3">
                  <span className="text-sm font-semibold">
                    {c.authorUrl ? (
                      <a
                        href={c.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="hover:text-primary"
                      >
                        {c.authorName}
                      </a>
                    ) : (
                      c.authorName
                    )}
                  </span>
                  <span className="font-mono text-xs text-[var(--brand-text-faint)] tabular-nums">
                    {formatDate(c.createdAt, locale)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{dict.comments.nameLabel}</span>
              <input
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={dict.comments.namePlaceholder}
                className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{dict.comments.emailLabel}</span>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder={dict.comments.emailPlaceholder}
                className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Honeypot — hidden from real visitors via CSS, never via display:none (some bots skip those). */}
          <label className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true" tabIndex={-1}>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{dict.comments.bodyLabel}</span>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={dict.comments.bodyPlaceholder}
              className="resize-none rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap items-end gap-4">
            {challenge && (
              // eslint-disable-next-line @next/next/no-img-element -- backend-generated captcha image, not an optimizable asset
              <img src={challenge.imageUrl} alt="" className="h-12 rounded-[8px] border border-border" />
            )}
            <button
              type="button"
              onClick={fetchChallenge}
              className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {dict.comments.captchaRefresh}
            </button>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{dict.comments.captchaLabel}</span>
              <input
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder={dict.comments.captchaPlaceholder}
                className="max-w-[180px] rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {status === 'success' && <p className="text-sm text-primary">{dict.comments.published}</p>}
          {status === 'error' && <p className="text-sm text-destructive">{dict.comments.genericError}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === 'submitting' ? dict.comments.submitting : dict.comments.submit}
          </button>
        </form>
      </div>

      {pendingModalOpen && (
        <div
          role="presentation"
          onClick={() => setPendingModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-comment-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-[14px] border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-4 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5M12 16h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h3 id="pending-comment-title" className="mb-2 font-heading text-lg font-bold tracking-tight">
              {dict.comments.pendingTitle}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">{dict.comments.pendingBody}</p>
            <button
              type="button"
              onClick={() => setPendingModalOpen(false)}
              className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {dict.comments.pendingClose}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
