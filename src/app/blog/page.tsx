import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { getAllPosts, getAllTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "风不止的全部文章列表，可按标签筛选。",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-muted">共 {posts.length} 篇</p>
      </header>

      {/* 顶部标签筛选：点某个标签跳到 /tags/<标签>，那里只显示该标签的文章 */}
      <TagFilterBar tags={tags} />

      {posts.length > 0 ? (
        <div className="flex flex-col">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-sm text-muted">还没有文章。</p>
      )}
    </div>
  );
}