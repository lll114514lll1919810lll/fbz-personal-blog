import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.author} 和这个博客。`,
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* 页面标题不放进 .prose：.prose 会把它压成正文大小，
          反而比下面的 h2 小，层级就乱了 */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">关于</h1>
        <p className="text-sm text-muted">
          {siteConfig.author} 的个人博客
        </p>
      </header>

      {/* max-w-[42rem] 把正文约束在约 40 字/行：中文长文超过 45 字就容易串行。
            max-w-none 会让 prose 铺满整个容器，宽屏下行长失控。 */}
      <div className="prose max-w-[42rem] border-t border-border pt-8">
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
          <li>
            <strong>阅读体验</strong>：文章带目录、阅读进度条和上下篇导航，明暗配色跟随系统
          </li>
        </ul>

        <h2>关于我</h2>
        <p>这里可以写你的职业、技术栈、联系方式，或者任何你想让读者知道的事。</p>

        <blockquote>
          <p>风不止，但行有恒。</p>
        </blockquote>
      </div>
    </div>
  );
}