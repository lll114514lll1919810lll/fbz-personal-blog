import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "标签",
  description: "按标签浏览文章。",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">标签</h1>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted hover:text-accent"
            >
              {tag}
              <span className="text-xs text-muted-foreground">{count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">还没有任何标签。</p>
      )}
    </div>
  );
}