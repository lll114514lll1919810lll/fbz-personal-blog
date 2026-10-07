import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getAllTags, getPostsByTag } from "@/lib/posts";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)}`, description: `标签 ${decodeURIComponent(tag)} 下的全部文章。` };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);

  if (posts.length === 0) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">#{decoded}</h1>
        <p className="text-sm text-muted-foreground">共 {posts.length} 篇</p>
      </div>

      <div className="flex flex-col">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      <Link
        href="/tags"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 返回标签列表
      </Link>
    </div>
  );
}