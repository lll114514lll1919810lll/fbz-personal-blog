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
 * - 框架、组件、样式等源码走 AGPL-3.0，见仓库根目录的 LICENSE；
 * - 文章正文走 CC BY-NC-SA 4.0（署名 - 非商业性 - 相同方式共享），
 *   详见根目录的 CONTENT-LICENSE.md。
 *
 * 代码为什么是 AGPL 而不是 MIT：站点集成了
 * [liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl)
 * 的液态玻璃渲染器，那个项目是 AGPL-3.0。AGPL 的要求是「通过网络提供服务
 * 时，必须向使用者提供完整源码」，所以整个站点的源码都得按 AGPL 走，
 * 不能只把那一个组件单独标成 AGPL。源码仓库公开，底栏和「关于」页都给了
 * 链接，这一条就算履行了。
 *
 * 注意 AGPL 限制的是「要不要公开源码」，不限制商用——想拿去改着用、甚至
 * 用在商业项目里都可以，条件是衍生作品同样开源，并且通过网络提供服务时
 * 也要把源码给出去。文章那头是另一回事：不希望被收费转载或塞进付费课程。
 *
 * 这里只存「给人看的文案」和链接，具体的权利义务以根目录两份文件为准，
 * 避免同一套条款在两处各写一遍、日后改漏。
 */
export const LICENSE = {
  // 源码（AGPL-3.0）。codeUrl 直接指向仓库而不是协议正文：
  // AGPL 第 13 条要求向网络使用者「提供完整源码」，指向仓库才算履行，
  // 只链一份协议全文不算。
  code: "AGPL-3.0",
  codeUrl: "https://github.com/lll114514lll1919810lll/fbz-personal-blog",
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