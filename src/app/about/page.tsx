import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.author} 和这个博客。`,
};

export default function AboutPage() {
  return (
    <div className="prose max-w-none">
      <h1>关于</h1>
      <p>
        你好，我是 <strong>{siteConfig.author}</strong>。这里是{siteConfig.name}
        ，用来存放我的技术笔记、思考和随手记录。
      </p>

      <h2>这个博客怎么写的</h2>
      <ul>
        <li>
          <strong>技术栈</strong>：Next.js 16（App Router）+ TypeScript +
          Tailwind CSS v4
        </li>
        <li>
          <strong>内容格式</strong>：MDX。写文章就是新建{" "}
          <code>src/content/</code> 下的{" "}
          <code>.mdx</code> 文件，不需要数据库，也不需要后台管理界面
        </li>
        <li>
          <strong>构建方式</strong>：构建时预渲染成静态 HTML，访问速度快，对搜索引擎友好
        </li>
      </ul>

      <h2>关于我</h2>
      <p>这里可以写你的职业、技术栈、联系方式，或者任何你想让读者知道的事。</p>

      <blockquote>
        <p>风不止，但行有恒。</p>
      </blockquote>
    </div>
  );
}