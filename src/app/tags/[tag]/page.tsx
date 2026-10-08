import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { getAllTags, getPostsByTag } from "@/lib/posts";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    description: `标签 ${decoded} 下的全部文章。`,
  };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);

  // 标签存在但没有文章时不 404，只给空状态提示：
  // 一个标签在 /tags 页面上有入口，点进来就该看到明确反馈而不是 404
  if (!getAllTags().some((t) => t.tag === decoded)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="panel panel-strong flex flex-col gap-1 px-6 py-5">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-accent">#</span>
          {decoded}
        </h1>
        <p className="text-sm text-muted">共 {posts.length} 篇</p>
      </header>

      {/* 同一套筛选栏，当前标签高亮，「全部」可一键清除筛选 */}
      <TagFilterBar tags={getAllTags()} activeTag={decoded} />

      {/* 卡片各自是独立面板，靠间距分隔（不再用分隔线） */}
      {posts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-sm text-muted">
          这个标签下还没有文章。{" "}
          <Link href="/blog" className="text-accent hover:opacity-70">
            看看全部文章 →
          </Link>
        </p>
      )}
    </div>
  );
}