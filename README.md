# 风不止的个人博客

Next.js 16 + TypeScript + Tailwind CSS v4 搭建的个人博客，中文界面，MDX 写作。

## 快速开始

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器 http://localhost:3000
pnpm build       # 生产构建（会预渲染成静态 HTML）
pnpm start       # 预览生产构建
```

## 目录结构

```
src/
├── app/                    路由：每个文件夹对应一个网址
│   ├── layout.tsx          全站外壳（导航 + 页脚），所有页面共享
│   ├── page.tsx            首页        /
│   ├── globals.css         全站样式，含 MDX 正文排版
│   ├── blog/
│   │   ├── page.tsx        文章列表    /blog
│   │   └── [slug]/         文章详情    /blog/<slug>
│   ├── tags/
│   │   ├── page.tsx        标签列表    /tags
│   │   └── [tag]/          标签详情    /tags/<tag>
│   └── about/page.tsx      关于        /about
├── content/                ← 文章正文都放这里
│   ├── hello-world.mdx
│   ├── nextjs-16-breaking-changes.mdx
│   └── how-to-write-with-mdx.mdx
├── components/
│   ├── site-chrome.tsx     页头 / 页脚
│   └── post-card.tsx       文章列表里的一张卡片
├── lib/
│   ├── posts.ts            读取 content/ 的工具函数
│   ├── site.ts             站名、简介、导航配置 ← 改站点信息看这里
│   └── date.ts             日期格式化
└── mdx-components.tsx      全局 MDX 组件映射
```

## 怎么写一篇新文章

在 `src/content/` 新建一个 `.mdx` 文件，文件名就是网址后缀。
比如新建 `my-first-post.mdx`，它的地址就是 `/blog/my-first-post`。

文件内容：

```mdx
export const metadata = {
  title: "文章标题",
  date: "2026-10-07",              // 必填，格式必须严格是 YYYY-MM-DD
  description: "一句话摘要",         // 列表页和分享卡片会显示
  tags: ["技术", "随笔"],           // 可选
  draft: false,                    // 可选，true 时不显示在列表和构建产物里
}

# 正文从这里开始

支持 **Markdown** 全部语法，还可以用 `代码块`、表格、引用、任务列表。
```

保存后浏览器会自动刷新，首页和列表页立刻能看到。

> 注意：元信息用的是 `export const metadata = {...}` 这种 JavaScript 写法，
> 不是常见的 YAML frontmatter（`---` 包裹那种）。这是 `@next/mdx` 原生支持的方式，
> 不需要额外装解析 frontmatter 的库。

## 改站点信息

站名、简介、导航菜单都在 `src/lib/site.ts`，只改这一个文件。
上线后记得把里面的 `url` 填成你的正式域名。

## 技术说明

- **Turbopack 是默认的**，`next.config.ts` 里的 remark/rehype 插件必须写**字符串名**（如
  `"remark-gfm"`），因为 Turbopack 无法把 JavaScript 函数传给 Rust
- **Next.js 16 中 `params` 是 Promise**，必须 `await`；类型直接用全局的
  `PageProps<'/blog/[slug]'>`，不用手写
- 文章页和标签页用 `generateStaticParams` 在构建时预渲染，部署到静态托管即可
- 正文样式在 `globals.css` 的 `.prose` 块里，通过后代选择器作用于 MDX 生成的裸 HTML

## 部署

还没配部署，本地跑通即可。需要上线时告诉我目标平台
（GitHub Pages / Vercel / Cloudflare），我再补配置。