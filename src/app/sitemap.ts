import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

/*
 * 同 robots.ts：静态导出下元数据路由必须显式声明 force-static，
 * 否则构建会报 "export const dynamic ... not configured on route"。
 */
export const dynamic = "force-static";

/**
 * 构建期生成 sitemap.xml。
 *
 * 静态导出下这是纯构建产物，不需要运行时；
 * 新增文章后重新部署即可（Cloudflare Pages 每次 push 都会重建）。
 *
 * 域名只有一个来源：siteConfig.url。改域名只改 lib/site.ts 一处，
 * 这里、robots.ts、OG 分享卡片都会跟着变，不会出现两处写不一致。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  // 本地开发 url 可能为空（或者部署前还没配），此时不产出 sitemap，
  // 免得生成一堆指向 localhost 的假地址被搜索引擎抓走。
  if (!base) return [];

  const posts = getAllPosts();
  const tags = getAllTags();

  return [
    {
      url: base,
      lastModified: posts[0] ? new Date(posts[0].date) : new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: `${base}/blog/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tags/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about/`, changeFrequency: "yearly", priority: 0.5 },

    // 文章：lastModified 用文章自己的日期（YYYY-MM-DD）。
    // 统一转成 UTC 是因为 sitemap 协议要求 W3C Date 格式，
    // 不带时区会被部分解析器当成当地时间，导致修改时间整体偏移。
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}/`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),

    // 标签页：中文标签要编码成 URL 才能被搜索引擎正确解析
    ...tags.map(({ tag, count }) => ({
      url: `${base}/tags/${encodeURIComponent(tag)}/`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      // 文章越少的标签页排序权重越低，避免大量薄内容稀释权重
      priority: count >= 2 ? 0.6 : 0.3,
    })),
  ];
}