import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/date";

/**
 * 文章列表里的一项。
 *
 * 微交互思路（极简风格）：
 * - 平时只有标题和时间，摘要淡到几乎看不见，保持列表的克制
 * - 悬停时整行泛出淡底色，摘要和标签淡入，露出更多信息
 * - 标题左侧有一条短横线，悬停时横向延展，作为「这里可点」的暗示
 */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group relative border-b border-border last:border-b-0">
      {/* 用绝对定位的链接铺满整行作为悬停热区，比只让文字可点更好点。
          tabIndex={-1} 让它不进入 Tab 顺序，键盘用户走下方的真实链接。 */}
      <Link
        href={`/blog/${post.slug}`}
        className="absolute inset-0 z-0"
        aria-label={post.title}
        tabIndex={-1}
      />

      <div className="pointer-events-none relative z-10 flex flex-col gap-2 py-6 transition-colors duration-200 group-hover:bg-surface sm:px-4 sm:-mx-4 sm:rounded-lg">
        <div className="flex items-baseline gap-3 text-[13px]">
          <time
            dateTime={post.date}
            className="shrink-0 tabular-nums text-muted transition-colors group-hover:text-secondary"
          >
            {formatDate(post.date)}
          </time>

          {post.readingTime !== undefined && (
            <span className="text-muted transition-colors group-hover:text-secondary">
              {post.readingTime} 分钟
            </span>
          )}

          {/* 标签默认隐藏，悬停淡入 —— 克制的信息层级 */}
          {post.tags && post.tags.length > 0 && (
            <span className="ml-auto hidden shrink-0 gap-1.5 sm:flex">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded border border-border px-1.5 py-1 text-[11px] leading-none text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* 用 pl-9 给标题留出左侧空间，横线就长在这块空间里。
            不加 padding 的话，横线延展会越过边界压到文字上。 */}
        <h2 className="relative pl-9 text-lg font-semibold leading-snug tracking-tight">
          {/* 标题前的短横线：悬停时延展，始终停在文字左侧 */}
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-accent transition-all duration-200 group-hover:w-6"
          />
          <span className="transition-colors group-hover:text-accent">
            {post.title}
          </span>
        </h2>

        {post.description && (
          <p className="text-sm leading-relaxed text-secondary opacity-70 transition-opacity duration-200 group-hover:opacity-100">
            {post.description}
          </p>
        )}
      </div>
    </article>
  );
}