import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();
  const latest = posts.slice(0, 5);

  return (
    <div className="flex flex-col gap-12">
      {/* 站点介绍 */}
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{siteConfig.name}</h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="flex gap-3 pt-2 text-sm">
          <Link
            href="/blog"
            className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85"
          >
            开始阅读
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-muted"
          >
            关于我
          </Link>
        </div>
      </section>

      {/* 最新文章 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">最新文章</h2>
          {posts.length > latest.length && (
            <Link
              href="/blog"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              查看全部 {posts.length} 篇 →
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
          <p className="py-8 text-sm text-muted-foreground">
            还没有文章。去{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              src/content/
            </code>{" "}
            新建一个 <code className="rounded bg-muted px-1.5 py-0.5">.mdx</code>{" "}
            文件开始写吧。
          </p>
        )}
      </section>
    </div>
  );
}