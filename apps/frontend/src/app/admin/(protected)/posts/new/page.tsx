import { PostEditor } from "@/widgets/admin/post-editor";

export default function AdminNewPostPage() {
  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Новый пост</h1>
      <PostEditor />
    </div>
  );
}
