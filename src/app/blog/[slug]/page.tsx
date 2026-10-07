import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostNavigation } from "@/components/post-navigation";
import { TableOfContents } from "@/components/table-of-contents";
import { getAllPosts, getPostBySlug, getTableOfContents } from "@/lib/posts";
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

  const [toc, allPosts] = [getTableOfContents(slug), getAllPosts()];

  // 只有真正渲染正文时才加载 MDX 模块，列表页不碰它。
  const { default: Content } = await import(`@/content/${slug}.mdx`);

  const index = allPosts.findIndex((p) => p.slug === slug);

  return (
    <div className="flex flex-col gap-8">
      {/* 移动端：目录收在折叠按钮里 */}
      <div className="xl:hidden">
        <TableOfContents variant="collapsible" items={toc} />
      </div>

      <div className="flex flex-col gap-10 xl:flex-row xl:gap-12">
        <article className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 pb-8">
            <div className="flex items-center gap-2.5 text-[13px] text-muted">
              <Link
                href="/blog"
                className="transition-colors hover:text-secondary"
              >
                文章
              </Link>
              <span aria-hidden>/</span>
              <span className="truncate">{post.tags?.[0] ?? "未分类"}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-base leading-relaxed text-secondary">
                {post.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
              <time dateTime={post.date} className="tabular-nums">
                {formatDate(post.date)}
              </time>
              <span aria-hidden>·</span>
              <span>{post.readingTime} 分钟读完</span>

              {post.tags && post.tags.length > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="rounded border border-border px-1.5 py-0.5 text-[11px] leading-none transition-colors hover:border-accent hover:text-accent"
                      >
                        {tag}
                      </Link>
                    ))}
                  </span>
                </>
              )}
            </div>
          </header>

          <div className="prose border-t border-border pt-8">
            <Content />
          </div>

          <div className="mt-12">
            <PostNavigation
              previous={allPosts[index + 1]}
              next={allPosts[index - 1]}
            />
          </div>
        </article>

        {/* 桌面端：正文右侧的目录列。宽度给到 w-64，否则长标题会频繁折行。 */}
        <div className="hidden w-64 shrink-0 xl:block">
          <TableOfContents variant="sidebar" items={toc} />
        </div>
      </div>
    </div>
  );
}