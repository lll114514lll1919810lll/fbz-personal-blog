import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/date";
import { LinkPending } from "@/components/link-pending";

const coverThemes = ["cover-sky", "cover-violet", "cover-amber", "cover-mint"];

function getCoverTheme(slug: string) {
  const score = [...slug].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return coverThemes[score % coverThemes.length];
}

/**
 * 文章列表里的一项。
 *
 * 一张卡片就是一个独立圆角亚克力面板，浮在背景图之上。
 * 卡片之间靠间距分隔（父容器 gap-3），不再用分隔线——
 * 面板本身有边框和阴影，再加横线会显得脏。
 *
 * 微交互思路（极简风格）：
 * - 平时只有标题和时间，摘要淡到几乎看不见，保持列表的克制
 * - 悬停时面板底色变实一点，摘要和标签淡入，露出更多信息
 * - 标题左侧有一条短横线，悬停时横向延展，作为「这里可点」的暗示
 */
export function PostCard({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  const coverTheme = getCoverTheme(post.slug);

  return (
    <article className={`group relative ${featured ? "h-full" : ""}`}>
      {/* 用绝对定位的链接铺满整行作为悬停热区，比只让文字可点更好点。
          tabIndex={-1} 让它不进入 Tab 顺序，键盘用户走下方的真实链接。

          热区本身是空的可点击区域，没有文字可显示「点击中」状态，
          所以在里面铺一层 LinkPending：导航等待期间整行轻微压暗，
          用户能立刻确认点击生效（本地几乎无感，真实网络下很有用）。 */}
      <Link
        href={`/blog/${post.slug}`}
        className="absolute inset-0 z-0 rounded-[var(--radius-panel)]"
        aria-label={post.title}
        tabIndex={-1}
      >
        <LinkPending />
      </Link>

{/* pointer-events-none 必须保留：内容层盖在热区链接之上，
            去掉它点击标题就不会导航了（事件被这一层吃掉）。
            悬停效果靠 group-hover 从 article 上继承，不影响。 */}
      <div
        className={`panel pointer-events-none relative z-10 h-full overflow-hidden transition-colors duration-200 group-hover:border-accent/30 group-hover:bg-panel-strong ${
          featured ? "flex flex-col md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]" : ""
        }`}
      >
        <div className={`cover-art ${coverTheme} ${featured ? "min-h-56 md:min-h-full" : "aspect-[2.2/1]"}`}>
          <span className="cover-grid" aria-hidden="true" />
          <span className="cover-orbit cover-orbit-one" aria-hidden="true" />
          <span className="cover-orbit cover-orbit-two" aria-hidden="true" />
          <span className="cover-label">风不止 / NOTES</span>
          <span className="cover-index">0{(post.slug.length % 9) + 1}</span>
        </div>

        <div className={`flex flex-col gap-3 px-5 py-5 ${featured ? "md:justify-center md:px-8 md:py-8" : ""}`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
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

          {post.tags && post.tags.length > 0 && (
            <span className="ml-auto flex shrink-0 gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-border px-2 py-1 text-[11px] leading-none text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent"
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
        </div>

        <h2 className={`text-lg font-semibold leading-snug tracking-tight ${featured ? "text-2xl sm:text-3xl" : ""}`}>
          <span
            className="transition-colors group-hover:text-accent"
          >
            <LinkPending>{post.title}</LinkPending>
          </span>
        </h2>

        {post.description && (
          <p className={`text-sm leading-relaxed text-secondary transition-opacity duration-200 ${featured ? "max-w-xl" : "line-clamp-2 opacity-80 group-hover:opacity-100"}`}>
            {post.description}
          </p>
        )}
        </div>
      </div>
    </article>
  );
}