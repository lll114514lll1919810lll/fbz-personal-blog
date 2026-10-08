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

const nextConfig: NextConfig = {
  // 让 .md / .mdx 文件可以被 Next.js 当作路由或模块处理
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);