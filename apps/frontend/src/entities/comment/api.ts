import type { SupportedLocale } from '@/middleware';

const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? 'http://localhost:3000';

export type CommentTargetType = 'post' | 'case';

export interface CommentItem {
  id: string;
  authorName: string;
  authorUrl?: string;
  body: string;
  createdAt: string;
}

export async function getComments(
  slug: string,
  locale: SupportedLocale,
  targetType: CommentTargetType = 'post',
  page = 1,
  perPage = 50,
) {
  const resource = targetType === 'case' ? 'cases' : 'posts';
  const response = await fetch(
    `${INTERNAL_API_BASE_URL}/api/v1/${resource}/${encodeURIComponent(slug)}/comments?locale=${locale}&page=${page}&per_page=${perPage}`,
  );
  if (!response.ok) return [];
  const payload = (await response.json().catch(() => null)) as { data?: CommentItem[] } | null;
  return payload?.data ?? [];
}
