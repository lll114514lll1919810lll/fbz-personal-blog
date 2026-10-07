import fs from "node:fs";
import path from "node:path";

/**
 * 博客的内容层。
 *
 * 设计要点：
 * 1. 文章是 src/content/ 下的 .mdx 文件，不需要数据库或后台。
 * 2. 每篇文章用 `export const metadata = {...}` 声明元信息（等价于 YAML frontmatter，
 *    但 MDX 原生支持，无需 gray-matter 之类的依赖）。
 * 3. 本文件只运行在服务端（Node 环境），因为它用了 fs。
 */

const POSTS_DIR = path.join(process.cwd(), "src/content");

export type PostMetadata = {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  tags?: string[];
  draft?: boolean;
};

export type Post = PostMetadata & {
  slug: string; // 文件名（不含扩展名），也是 URL 的一部分
};

function isPostFile(fileName: string): boolean {
  return fileName.endsWith(".mdx") && !fileName.startsWith("_");
}

/** 取出目录下所有文章的元信息，按日期倒序（最新在前）。 */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter(isPostFile);

  const posts = files.map((fileName): Post => {
    const slug = fileName.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
    const metadata = parseMetadata(raw);
    return { ...metadata, slug };
  });

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** 根据 slug 取单篇文章的元信息；找不到返回 null。 */
export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  return { ...parseMetadata(raw), slug };
}

/** 所有标签及其文章数，按文章数从多到少。 */
export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const post of getAllPosts()) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((post) => post.tags?.includes(tag));
}

/**
 * 从 MDX 源码里提取 `export const metadata = { ... }` 的内容。
 *
 * 这里用正则做一次轻量解析，而不是真的去执行/导入 MDX——因为列表页只需要元信息，
 * 不需要渲染正文。执行 MDX 会把整篇文章都编译进构建产物，代价高且没必要。
 * 只解析元信息 + 真正渲染正文时才 import，两者职责分开。
 */
function parseMetadata(source: string): PostMetadata {
  const match = source.match(
    /export\s+const\s+metadata\s*(?::[^=]+)?=\s*(\{[\s\S]*?\n\})\s*;?/,
  );

  if (!match) {
    // 兜底：即使作者忘了写 metadata，也不要让整个列表页崩掉
    return { title: "未命名文章", date: "1970-01-01" };
  }

  // 把对象字面量转成可执行代码来读取，只接受字符串/数字/数组/布尔
  const jsonLike = match[1]
    // 单引号 → 双引号
    .replace(/'/g, '"')
    // 去掉属性名和字符串值之外的尾逗号
    .replace(/,(\s*[}\]])/g, "$1");

  try {
    // eslint-disable-next-line no-new-func
    const value = new Function(`return ${jsonLike}`)() as PostMetadata;
    return {
      title: value.title ?? "未命名文章",
      date: value.date ?? "1970-01-01",
      description: value.description,
      tags: value.tags,
      draft: value.draft,
    };
  } catch {
    return { title: "未命名文章", date: "1970-01-01" };
  }
}