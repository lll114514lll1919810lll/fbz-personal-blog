import type { Metadata } from "next";
import { LICENSE, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.author} 和这个博客。`,
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <header className="page-hero panel panel-strong grid gap-8 px-7 py-8 sm:px-10 sm:py-9 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">ABOUT THIS SPACE</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">关于</h1>
          <p className="max-w-xl text-base leading-relaxed text-secondary">
            {siteConfig.author} 的个人博客，记录学习、实践，也记录偶尔停下来观察生活的时刻。
          </p>
        </div>
        <div className="about-mark" aria-hidden="true">
          <svg
            className="about-atom"
            viewBox="0 0 160 160"
            fill="none"
            role="presentation"
          >
            <ellipse cx="80" cy="80" rx="62" ry="24" stroke="currentColor" strokeWidth="4" />
            <ellipse
              cx="80"
              cy="80"
              rx="62"
              ry="24"
              transform="rotate(60 80 80)"
              stroke="currentColor"
              strokeWidth="4"
            />
            <ellipse
              cx="80"
              cy="80"
              rx="62"
              ry="24"
              transform="rotate(120 80 80)"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle cx="80" cy="80" r="14" fill="currentColor" />
            <circle cx="75" cy="75" r="3" fill="var(--background)" />
            <circle cx="86" cy="84" r="3" fill="var(--background)" />
          </svg>
        </div>
      </header>

      {/* max-w-[42rem] 把正文约束在约 40 字/行：中文长文超过 45 字就容易串行。
            max-w-none 会让 prose 铺满整个容器，宽屏下行长失控。 */}
      <div className="panel panel-strong prose max-w-3xl px-6 py-7 sm:px-10 sm:py-9">
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
            <code>.mdx</code> 文件，不需要数据库
          </li>
          <li>
            <strong>构建方式</strong>：构建时预渲染成静态 HTML，访问速度快，对搜索引擎友好
          </li>
          <li>
            <strong>阅读体验</strong>：文章带目录、阅读进度条和上下篇导航，明暗配色跟随系统
          </li>
        </ul>

        <h2>转载与引用</h2>
        <p>
          这个站分两部分授权。<strong>主题代码</strong>用{" "}
          <a href={LICENSE.codeUrl} target="_blank" rel="noreferrer">
            MIT
          </a>
          ，随你改、可以商用；<strong>文章正文</strong>用{" "}
          <a href={LICENSE.contentUrl} target="_blank" rel="noreferrer">
            CC BY-NC-SA 4.0
          </a>
          ，转载和翻译都欢迎，但要署名、不能商用，改了再发得沿用同一协议。
        </p>
        <p>
          本站源码仓库链接在{" "}
          <a 
            href={siteConfig.repo}
            target="_blank"
            rel="noreferrer"
          >
            这里
          </a>
          {" "}，细节写在仓库的{" "}
          <a
            href={`${siteConfig.repo}/blob/main/CONTENT-LICENSE.md`}
            target="_blank"
            rel="noreferrer"
          >
            CONTENT-LICENSE.md
          </a>
          {" "}。文章里引用的代码块按 MIT 处理，直接拿去用即可。
        </p>

        <h2>关于我</h2>
        <p>
          一个热爱技术与 AI 、喜欢分享的普通人。你可以在{" "}
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>{" "}
          找到我。
        </p>

        <blockquote>
          <p>风不止，但行有恒。</p>
        </blockquote>
      </div>
    </div>
  );
}