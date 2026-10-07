import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { formatDate } from "@/lib/date";

/**
 * 预渲染所有文章页。
 *
 * Next.js 在构建时就会对每个 slug 生成一份静态 HTML，用户访问时无需等待计算，
 * 速度和 SEO 都更好。params 在 Next.js 16 中是 Promise，必须 await。
 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** 每篇文章独立的 <head>：标题、描述、Open Graph 分享卡片。 */
export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return { title: "文章不存在" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // 只有真正渲染正文时才加载 MDX 模块，列表页不碰它。
  const { default: Content } = await import(`@/content/${slug}.mdx`);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.tags && post.tags.length > 0 && (
            <span className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:text-accent"
                >
                  {tag}
                </Link>
              ))}
            </span>
          )}
        </div>

        {post.description && (
          <p className="text-muted-foreground">{post.description}</p>
        )}
      </header>

      {/* prose 类在 globals.css 里定义，用来给 MDX 生成的裸 HTML 排版 */}
      <div className="prose max-w-none">
        <Content />
      </div>

      <footer className="border-t border-border pt-6">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 返回文章列表
        </Link>
      </footer>
    </article>
  );
}