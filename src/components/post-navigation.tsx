import Link from "next/link";
import type { Post } from "@/lib/posts";

/**
 * 文章末尾的「上一篇 / 下一篇」。
 *
 * getAllPosts 已按日期倒序排列，所以当前文章的下标 +1 是更旧的（上一篇），
 * -1 是更新的（下一篇）。到头/到尾时对应一侧不渲染，避免出现空链接。
 */
export function PostNavigation({
  previous,
  next,
}: {
  previous?: Post;
  next?: Post;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="文章导航"
      className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-surface"
        >
          <span className="text-xs text-muted">← 上一篇</span>
          <span className="text-sm font-medium transition-colors group-hover:text-accent">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}

      {next && (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:bg-surface sm:col-start-2"
        >
          <span className="text-xs text-muted">下一篇 →</span>
          <span className="text-sm font-medium transition-colors group-hover:text-accent">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}