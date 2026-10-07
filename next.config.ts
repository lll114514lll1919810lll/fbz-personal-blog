import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// 注意：这里不能 import remarkGfm / rehypeSlug 再传函数进去，
// Next.js 16 默认的 Turbopack 无法把 JavaScript 函数传给 Rust，
// 所以插件必须写成字符串名，由 @next/mdx 内部自行解析。
// （写成 `remarkGfm` 这样的函数引用会导致构建报错。）
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

const nextConfig: NextConfig = {
  // 让 .md / .mdx 文件可以被 Next.js 当作路由或模块处理
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);