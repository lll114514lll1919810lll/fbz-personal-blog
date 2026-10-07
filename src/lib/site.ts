/**
 * 站点全局配置。
 * 想改站名、简介、社交链接，只改这一个文件就够了。
 */
export const siteConfig = {
  name: "风不止的个人博客",
  author: "风不止",
  description: "记录技术、思考与生活。这里存放风不止的笔记与文章。",
  // 部署后改成你的正式域名，部署前先留空也不影响本地运行
  url: "",
} as const;

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
] as const;