import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// 注意：这里不能 import remarkGfm / rehypeSlug 再传函数进去，
// Next.js 16 默认的 Turbopack 无法把 JavaScript函数传给 Rust，
// 所以插件必须写成字符串名，由 @next/mdx 内部自行解析。
// （写成 `remarkGfm` 这样的函数引用会导致构建报错。）
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      "rehype-slug",
      [
        // Shiki 高亮。插件配置只能通过字符串名传，
        // options 要写成 [name, options] 的元组形式。
        "rehype-pretty-code",
        {
          /**
           * defaultColor:false 是双主题的关键——它不直接给元素上色，
           * 而是同时输出浅色和深色两套颜色到 CSS 变量
           *（--shiki-light / --shiki-dark），再由 CSS 按系统配色选用。
           * 这样切换明暗不需要任何 JS，也不会有闪烁。
           */
          defaultColor: false,
          theme: {
            light: "github-light",
            dark: "github-dark",
          },
        },
      ],
    ],
  },
});

/**
 * 静态导出开关。
 *
 * 部署到 Cloudflare Pages 时由构建环境注入 NEXT_OUTPUT=export，
 * 本地开发不加这个变量，行为和以前完全一样——这一点很重要：
 * 静态导出后产物里没有 Node 服务器，`pnpm start` 会直接失效。
 */
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  // 让 .md / .mdx 文件可以被 Next.js 当作路由或模块处理
  pageExtensions: ["ts", "tsx", "md", "mdx"],

  ...(isStaticExport
    ? {
        // 产出纯静态站点到 out/，交给 Cloudflare Pages 托管
        output: "export" as const,
        /*
         * 目录形式的产物：/about → /about/index.html（而不是 /about.html）。
         *
         * 选它是因为所有静态托管和 CDN 都能零配置映射「目录 → index.html」，
         * 日后要加国内 CDN 镜像时路径规则天然一致；
         * .html 结尾的形式则需要在每个加速端单独配 rewrite 规则。
         * 代价是每个页面多一次目录级请求，对博客这种页面量级可以忽略。
         */
        trailingSlash: true,
      }
    : {}),
};

export default withMDX(nextConfig);