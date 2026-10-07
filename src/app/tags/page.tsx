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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">标签</h1>
        <p className="text-sm text-muted">共 {tags.length} 个</p>
      </header>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="group flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-accent hover:bg-accent-soft"
            >
              {tag}
              <span className="text-xs tabular-nums text-muted transition-colors group-hover:text-accent">
                {count}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">还没有任何标签。</p>
      )}
    </div>
  );
}