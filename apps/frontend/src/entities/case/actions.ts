'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/shared/api/client';
import { unwrapEnvelope } from '@/shared/api/envelope';
import { getAdminAuthHeaders } from '@/shared/server/admin-api';
import type { components } from '@/lib/api/generated/schema';

function revalidatePublic() {
  revalidatePath('/ru');
  revalidatePath('/en');
  revalidatePath('/ru/cases');
  revalidatePath('/en/cases');
  revalidatePath('/admin/cases');
}

function formatApiError(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback;

  const payload = error as {
    error?: {
      message?: unknown;
      details?: { errors?: unknown };
    };
    message?: unknown;
  };
  const details = payload.error?.details?.errors;
  if (Array.isArray(details) && details.length > 0) return details.join('; ');
  if (typeof payload.error?.message === 'string') return payload.error.message;
  if (typeof payload.message === 'string') return payload.message;

  return fallback;
}

/**
 * Returns the created case (rather than calling redirect() itself) so the client component can
 * navigate via router.push() — a Server Action that redirects internally breaks when the caller
 * wraps the call in try/catch, since the redirect signal propagates as a thrown error too.
 */
export async function createCaseAction(body: components['schemas']['CreateCaseBody']) {
  const headers = await getAdminAuthHeaders();
  const { data, error } = await api.POST('/api/v1/admin/cases', { headers, body });
  const created = unwrapEnvelope(data);
  if (error || !created) throw new Error(formatApiError(error, 'Failed to create case'));
  revalidatePublic();
  return created;
}

export async function updateCaseAction(id: string, body: components['schemas']['UpdateCaseBody']) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH('/api/v1/admin/cases/{id}', { headers, params: { path: { id } }, body });
  if (error) throw new Error(formatApiError(error, 'Failed to update case'));
  revalidatePublic();
}

export async function deleteCaseAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE('/api/v1/admin/cases/{id}', { headers, params: { path: { id } } });
  if (error) throw new Error(formatApiError(error, 'Failed to delete case'));
  revalidatePublic();
}

export async function reorderCasesAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH('/api/v1/admin/cases/reorder', { headers, body: { items } });
  if (error) throw new Error(formatApiError(error, 'Failed to reorder cases'));
  revalidatePublic();
}
