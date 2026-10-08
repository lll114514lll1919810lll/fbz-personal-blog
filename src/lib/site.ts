/**
 * 站点全局配置。
 * 想改站名、简介、社交链接，只改这一个文件就够了。
 */
export const siteConfig = {
  name: "风不止的个人博客",
  author: "风不止",
  description: "记录技术、思考与生活。这里是风不止的个人博客。",
  // 正式域名。Cloudflare Pages 每次推送都会重新构建，
  // 所以改这里之后要 push 才生效。
  url: "https://blog.mclll114.me",
  github: "https://github.com/lll114514lll1919810lll",
} as const;

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
] as const;

/**
 * 顶栏、底栏、正文三者的内容宽度上限，保持左右对齐。
 *
 * 用 rem 而不是 Tailwind 的 max-w-* 类，因为正文宽度要能被用户调节
 * （见 lib/reading-width.ts），两者需要用同一套单位换算。
 * 数值偏大是有意的：内容更靠近屏幕两侧，超宽屏上不会挤成一小条。
 */
export const CONTENT_MAX_WIDTH = "112rem"; // 约 1792px