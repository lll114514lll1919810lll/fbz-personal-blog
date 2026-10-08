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
    <div className="flex flex-col gap-10 sm:gap-12">
      <header className="page-hero panel panel-strong flex flex-col gap-4 px-7 py-8 sm:px-10 sm:py-9">
        <p className="eyebrow">ALL WRITINGS</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">文章</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-secondary">
              从实践出发，记录技术、产品和那些值得慢慢想清楚的事情。
            </p>
          </div>
          <span className="text-sm text-muted">{posts.length} 篇文章</span>
        </div>
      </header>

      <section className="panel flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div>
          <p className="eyebrow">FILTER BY TOPIC</p>
          <p className="mt-2 text-sm text-secondary">按主题浏览文章</p>
        </div>
        <TagFilterBar tags={tags} />
      </section>

      {/* 卡片各自是独立面板，靠间距分隔（不再用分隔线）。
          手机 1 列、平板 2 列、电脑 3 列：768px 下三列每张只剩 ~230px，
          封面和标题会挤成一团，所以三列从 lg(1024px) 才开始。 */}
      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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