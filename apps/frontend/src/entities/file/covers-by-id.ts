import { getPublicCover } from "./api";

/** Batch cover lookup for a list of Cases/Posts, keyed by their own id — one parallel fetch per item. */
export async function coversById(ids: string[]): Promise<Record<string, string | undefined>> {
  const covers = await Promise.all(ids.map((id) => getPublicCover(id)));
  return Object.fromEntries(ids.map((id, index) => [id, covers[index]?.id]));
}
