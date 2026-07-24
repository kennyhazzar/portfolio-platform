import { api } from "@/shared/api/client";

export async function getTechnologies() {
  const { data } = await api.GET("/api/v1/technologies", { params: { query: { per_page: 50 } } });
  return data?.data ?? [];
}
