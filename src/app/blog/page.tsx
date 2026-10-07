import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "风不止的全部文章列表。",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-muted-foreground">共 {posts.length} 篇</p>
      </div>

      {posts.length > 0 ? (
        <div className="flex flex-col">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-sm text-muted-foreground">还没有文章。</p>
      )}
    </div>
  );
}