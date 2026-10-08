import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/code-block";

/**
 * 全局 MDX 组件映射。
 *
 * MDX 把 Markdown 标题、段落、列表等编译成裸 HTML 元素。这里可以给它们套上样式，
 * 对所有 .mdx 文章同时生效——相当于「全站文章统一样式」的唯一入口。
 * 这是 App Router 使用 @next/mdx 的必需文件。
 */
const components: MDXComponents = {
  /**
   * 接管所有 <pre>，给它加上复制按钮、语言标签和横向滚动提示。
   *
   * rehype-pretty-code 会把语言名写在 pre 的 data-language 属性上，
   * 这里把它取出来传给 CodeBlock 用于显示标签。
   */
  pre: ({ className, children, ...props }) => (
    <CodeBlock
      {...(props as React.HTMLAttributes<HTMLPreElement>)}
      className={className}
      language={
        (props as Record<string, unknown>)["data-language"] as
          | string
          | undefined
      }
    >
      {children}
    </CodeBlock>
  ),

  /**
   * 外链一律在新标签页打开。
   *
   * 技术博客的参考链接多是外部文档/GitHub 仓库，直接跳走会丢失阅读位置，
   * 而读者的意图通常是「看一眼就回来」。同时补 rel：
   * noopener 防止目标页通过 window.opener 反向操纵本页，
   * noreferrer 避免把访客来源泄漏给对方。
   */
  a: ({ href, children, ...props }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        {...props}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}