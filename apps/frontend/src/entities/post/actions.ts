'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/shared/api/client';
import { unwrapEnvelope } from '@/shared/api/envelope';
import { getAdminAuthHeaders } from '@/shared/server/admin-api';
import type { components } from '@/lib/api/generated/schema';

type ImportPostsBody = {
  items: Array<{
    locale: components['schemas']['PostAdminDto']['locale'];
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    seoTitle?: string;
    seoDescription?: string;
    status?: components['schemas']['PostAdminDto']['status'];
  }>;
};

export type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
};

function revalidatePublic() {
  revalidatePath('/ru');
  revalidatePath('/en');
  revalidatePath('/ru/posts');
  revalidatePath('/en/posts');
  revalidatePath('/admin/posts');
}

/**
 * Returns the created post (rather than calling redirect() itself) so the client component can
 * navigate via router.push() — a Server Action that redirects internally breaks when the caller
 * wraps the call in try/catch, since the redirect signal propagates as a thrown error too.
 */
export async function createPostAction(body: components['schemas']['CreatePostBody']) {
  const headers = await getAdminAuthHeaders();
  const { data, error } = await api.POST('/api/v1/admin/posts', { headers, body });
  const created = unwrapEnvelope(data);
  if (error || !created) throw new Error('Failed to create post');
  revalidatePublic();
  return created;
}

export async function updatePostAction(id: string, body: components['schemas']['UpdatePostBody']) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH('/api/v1/admin/posts/{id}', { headers, params: { path: { id } }, body });
  if (error) throw new Error('Failed to update post');
  revalidatePublic();
}

export async function deletePostAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE('/api/v1/admin/posts/{id}', { headers, params: { path: { id } } });
  if (error) throw new Error('Failed to delete post');
  revalidatePublic();
}

export async function importPostsAction(body: ImportPostsBody): Promise<ImportResult> {
  const headers = await getAdminAuthHeaders();
  const response = await fetch(
    `${process.env.INTERNAL_API_BASE_URL ?? 'http://localhost:3000'}/api/v1/admin/posts/import`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) throw new Error('Failed to import posts');
  const envelope = (await response.json()) as { data?: ImportResult };
  if (!envelope.data) throw new Error('Invalid import response');
  revalidatePublic();
  return envelope.data;
}
