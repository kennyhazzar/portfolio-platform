import type { components } from "@/lib/api/generated/schema";

type FileDto = components["schemas"]["FileDto"];

export interface UploadFileInput {
  module: "PUBLIC" | "USER";
  externalId: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER" | "USER_FILE";
  file: File;
  name?: string;
  description?: string;
  isCover?: boolean;
}

/**
 * Plain browser fetch to app/api/admin/files/route.ts — deliberately not a Server Action.
 * Passing a File nested in a plain object through a Server Action hung indefinitely in this app
 * rather than erroring or succeeding (see docs/planning/06-master-roadmap.md §2.5); a Route
 * Handler proxy is the same pattern already used for captcha/comments/view.
 */
export async function uploadFile(input: UploadFileInput): Promise<FileDto> {
  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("module", input.module);
  formData.set("externalId", input.externalId);
  formData.set("type", input.type);
  if (input.name) formData.set("name", input.name);
  if (input.description) formData.set("description", input.description);
  if (input.isCover !== undefined) formData.set("isCover", String(input.isCover));

  const response = await fetch("/api/admin/files", { method: "POST", body: formData });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data) throw new Error(payload?.error ?? "Failed to upload file");
  return payload.data as FileDto;
}
