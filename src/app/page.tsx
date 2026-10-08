import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();
  const featured = posts[0];
  const latest = posts.slice(1, 5);
  const totalWords = posts.reduce((sum, p) => sum + (p.readingTime ?? 0), 0);
  const tags = [...new Set(posts.flatMap((post) => post.tags ?? []))].slice(0, 5);

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <section className="home-hero panel panel-strong grid gap-10 overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-center">
        <div className="relative z-10 flex flex-col gap-5">
          <p className="eyebrow">PERSONAL NOTES · 2026</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            把复杂的事，<span className="text-accent">写简单。</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-secondary">
            {siteConfig.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm">
          <Link
            href="/blog"
            className="button-primary"
          >
            开始阅读
          </Link>
          <Link
            href="/about"
            className="-my-2 inline-flex items-center py-2 text-secondary transition-colors hover:text-foreground"
          >
            关于我 →
          </Link>
          </div>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <div className="hero-orbit-core">FZ</div>
          <span className="hero-orbit-ring hero-orbit-ring-one" />
          <span className="hero-orbit-ring hero-orbit-ring-two" />
          <span className="hero-orbit-dot hero-orbit-dot-one" />
          <span className="hero-orbit-dot hero-orbit-dot-two" />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)] lg:items-stretch">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">FEATURED</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">精选文章</h2>
            </div>
            {posts.length > 0 && (
            <Link
              href="/blog"
              className="button-quiet"
            >
              查看全部 →
            </Link>
            )}
          </div>
          {featured ? <PostCard post={featured} featured /> : <p className="py-8 text-sm text-muted">还没有文章。</p>}
        </div>

        <aside className="panel flex flex-col gap-6 px-6 py-6 lg:mt-16">
          <div>
            <p className="eyebrow">AT A GLANCE</p>
            <h2 className="mt-1 text-xl font-semibold">关于这个角落</h2>
          </div>
          <p className="text-sm leading-relaxed text-secondary">
            这里记录技术实践、产品观察，也保留一些不必急着得出结论的思考。
          </p>
          <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
            <div>
              <strong className="block text-2xl tracking-tight">{posts.length}</strong>
              <span className="text-xs text-muted">篇文章</span>
            </div>
            <div>
              <strong className="block text-2xl tracking-tight">{totalWords}</strong>
              <span className="text-xs text-muted">分钟阅读</span>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag-chip">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">LATEST WRITINGS</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">最近更新</h2>
          </div>
          <span className="text-sm text-muted">{posts.length} 篇</span>
        </div>
        {/* 手机 1 列 / 平板 2 列 / 电脑 3 列，与文章列表页保持一致 */}
        {latest.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        ) : (
          <p className="py-8 text-sm text-muted">更多文章正在路上。</p>
        )}
      </section>
    </div>
  );
}