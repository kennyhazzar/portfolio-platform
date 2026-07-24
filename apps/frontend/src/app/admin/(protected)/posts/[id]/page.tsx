import { notFound } from "next/navigation";
import { getPostAdmin } from "@/entities/post/admin-api";
import { getFilesByExternalId } from "@/entities/file/admin-api";
import { PostEditor } from "@/widgets/admin/post-editor";

export default async function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();
  const cover = (await getFilesByExternalId("PUBLIC", id)).find((f) => f.isCover) ?? null;

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Редактировать пост</h1>
      <PostEditor initial={post} initialCover={cover} />
    </div>
  );
}
