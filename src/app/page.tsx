import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();
  const latest = posts.slice(0, 5);
  const totalWords = posts.reduce((sum, p) => sum + (p.readingTime ?? 0), 0);

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      {/* 站点介绍 */}
      <section className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-secondary">
          {siteConfig.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm">
          <Link
            href="/blog"
            className="font-medium text-accent transition-opacity hover:opacity-70"
          >
            开始阅读 →
          </Link>
          <span className="text-muted">
            {posts.length} 篇文章 · 约 {totalWords} 分钟读完
          </span>
        </div>
      </section>

      {/* 最新文章 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium tracking-wide text-muted">
            最新文章
          </h2>
          {posts.length > latest.length && (
            <Link
              href="/blog"
              className="text-[13px] text-muted transition-colors hover:text-foreground"
            >
              全部 {posts.length} 篇 →
            </Link>
          )}
        </div>

        {latest.length > 0 ? (
          <div className="flex flex-col">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-muted">
            还没有文章。去{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">src/content/</code>{" "}
            新建一个{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">.mdx</code>{" "}
            文件开始写吧。
          </p>
        )}
      </section>
    </div>
  );
}