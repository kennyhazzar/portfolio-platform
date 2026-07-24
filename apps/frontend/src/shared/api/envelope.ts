/**
 * The backend's global TransformInterceptor wraps every non-paginated controller response in
 * `{ data: ... }` at runtime (apps/backend/src/interceptors/transform.interceptor.ts) — a
 * behavior the `@ApiOkResponse` decorators never declared, so it's invisible to the generated
 * OpenAPI schema. Paginated responses (already `{ data, meta }`-shaped) pass through unchanged
 * and don't need this; single objects and plain arrays (Hero/About/SiteSettings/Contacts/
 * Navigation) do.
 */
export function unwrapEnvelope<T>(value: T | undefined): T | null {
  if (value === undefined || value === null) return null;
  const envelope = value as unknown as { data: T };
  return envelope.data ?? null;
}
