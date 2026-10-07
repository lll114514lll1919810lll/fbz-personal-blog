import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/date";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group border-b border-border py-6 last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
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

        <h2 className="text-lg font-semibold leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h2>

        {post.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        )}
      </div>
    </article>
  );
}