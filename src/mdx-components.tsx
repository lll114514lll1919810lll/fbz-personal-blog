import type { MDXComponents } from "mdx/types";

/**
 * 全局 MDX 组件映射。
 *
 * MDX 把 Markdown 标题、段落、列表等编译成裸 HTML 元素。这里可以给它们套上样式，
 * 对所有 .mdx 文章同时生效——相当于「全站文章统一样式」的唯一入口。
 * 这是 App Router 使用 @next/mdx 的必需文件。
 */
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}