import createClient from "openapi-fetch";
import type { paths } from "../../lib/api/generated/schema";

/**
 * Server-only typed client — every call to the backend happens from Server Components /
 * Server Actions / Route Handlers, never the browser. See docs/planning/04-frontend-architecture.md §3.
 */
// Path keys in the generated schema already include the "/api/v1" global prefix baked into
// the backend's Swagger doc — the base URL must NOT repeat it.
const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000";

export const api = createClient<paths>({ baseUrl });
