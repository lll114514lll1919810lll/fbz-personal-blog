import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/post-body";
import { PostNavigation } from "@/components/post-navigation";
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
    <PostBody
      toc={toc}
      header={
        <header className="flex flex-col gap-4 pb-6">
          <div className="-my-2 flex items-center gap-2.5 py-2 text-[13px] text-muted">
            <Link
              href="/blog"
              className="inline-flex items-center py-2 transition-colors hover:text-secondary"
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
                <span className="-my-1.5 flex flex-wrap gap-1.5 py-1.5">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="inline-flex items-center rounded border border-border px-2 py-2.5 text-[11px] leading-none transition-colors hover:border-accent hover:text-accent"
                    >
                      {tag}
                    </Link>
                  ))}
                </span>
              </>
            )}
          </div>
        </header>
      }
      footer={
        <PostNavigation
          previous={allPosts[index + 1]}
          next={allPosts[index - 1]}
        />
      }
    >
      <Content />
    </PostBody>
  );
}