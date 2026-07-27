import Link from 'next/link';
import { getPostsAdmin } from '@/entities/post/admin-api';
import { PostImporter } from '@/widgets/admin/post-importer';
import { PostList } from '@/widgets/admin/post-list';

export default async function AdminPostsPage() {
  const posts = await getPostsAdmin();

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Посты</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Новый пост
        </Link>
      </div>
      <PostImporter />
      <PostList initial={posts} />
    </div>
  );
}
