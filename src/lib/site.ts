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
  // 博客源码仓库。署名链接（CC BY-NC-SA 4.0 要求给出可访问的原文来源）
  // 和「完整协议文本」都指向这里，所以单独存一份，不和 github 混用——
  // 那个是作者主页，不是源码地址。
  repo: "https://github.com/lll114514lll1919810lll/fbz-personal-blog",
} as const;

/**
 * 版权与授权。
 *
 * 这个站是「代码」和「内容」两套授权并行的：
 * - 框架、组件、样式等源码走 MIT，见仓库根目录的 LICENSE；
 * - 文章正文走 CC BY-NC-SA 4.0（署名 - 非商业性 - 相同方式共享），
 *   详见根目录的 CONTENT-LICENSE.md。
 *
 * 分开的理由很直接：博客主题可以被任何人拿去改着用、甚至用在商业项目里，
 * 而文章是作者写的东西，不希望被收费转载或塞进付费课程。GitHub 也认这套
 * 分类法——仓库选择一个 license 字段，文章的授权只能靠这里的常量和
 * CONTENT-LICENSE.md 声明。
 *
 * 这里只存「给人看的文案」和链接，具体的权利义务以根目录两份文件为准，
 * 避免同一套条款在两处各写一遍、日后改漏。
 */
export const LICENSE = {
  // 源码（MIT）
  code: "MIT",
  codeUrl: "https://opensource.org/license/mit",
  // 文章正文（Creative Commons）
  content: "CC BY-NC-SA 4.0",
  contentUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
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