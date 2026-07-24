import { api } from "@/shared/api/client";
import { unwrapEnvelope } from "@/shared/api/envelope";

export async function getContacts() {
  const { data } = await api.GET("/api/v1/contacts", {});
  return unwrapEnvelope(data) ?? [];
}
