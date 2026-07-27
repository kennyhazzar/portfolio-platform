'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/shared/api/client';
import { getAdminAuthHeaders } from '@/shared/server/admin-api';
import type { components } from '@/lib/api/generated/schema';

type ImportTechnologiesBody = {
  items: Array<{
    name: string;
    category?: components['schemas']['TechnologyDto']['category'];
    iconSlug?: string;
    position?: number;
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
  revalidatePath('/admin/technology');
}

export async function createTechnologyAction(body: components['schemas']['CreateTechnologyBody']) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.POST('/api/v1/admin/technologies', { headers, body });
  if (error) throw new Error('Failed to create technology');
  revalidatePublic();
}

export async function updateTechnologyAction(id: string, body: components['schemas']['UpdateTechnologyBody']) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH('/api/v1/admin/technologies/{id}', { headers, params: { path: { id } }, body });
  if (error) throw new Error('Failed to update technology');
  revalidatePublic();
}

export async function deleteTechnologyAction(id: string) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.DELETE('/api/v1/admin/technologies/{id}', { headers, params: { path: { id } } });
  if (error) throw new Error('Failed to delete technology');
  revalidatePublic();
}

export async function reorderTechnologiesAction(items: { id: string; position: number }[]) {
  const headers = await getAdminAuthHeaders();
  const { error } = await api.PATCH('/api/v1/admin/technologies/reorder', { headers, body: { items } });
  if (error) throw new Error('Failed to reorder technologies');
  revalidatePublic();
}

export async function importTechnologiesAction(body: ImportTechnologiesBody): Promise<ImportResult> {
  const headers = await getAdminAuthHeaders();
  const response = await fetch(
    `${process.env.INTERNAL_API_BASE_URL ?? 'http://localhost:3000'}/api/v1/admin/technologies/import`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) throw new Error('Failed to import technologies');
  const envelope = (await response.json()) as { data?: ImportResult };
  if (!envelope.data) throw new Error('Invalid import response');
  revalidatePublic();
  return envelope.data;
}
