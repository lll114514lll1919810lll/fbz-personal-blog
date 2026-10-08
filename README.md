# 风不止的个人博客

Next.js 16 + TypeScript + Tailwind CSS v4 搭建的个人博客，中文界面，MDX 写作。

## 快速开始

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器 http://localhost:3000
pnpm build       # 生产构建（会预渲染成静态 HTML）
pnpm start       # 预览生产构建

pnpm typecheck   # 类型检查
pnpm lint        # 代码检查
pnpm test        # 目录锚点一致性测试（需先启动 dev server）
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

> **不要在正文里写 `# 一级标题`**：文章页页头已经渲染了 `metadata.title`，
> 再写一遍会出现两个重复的大标题。正文从 `## 二级标题` 或普通段落开始即可。

> 注意：元信息用的是 `export const metadata = {...}` 这种 JavaScript 写法，
> 不是常见的 YAML frontmatter（`---` 包裹那种）。这是 `@next/mdx` 原生支持的方式，
> 不需要额外装解析 frontmatter 的库。

## 改站点信息

站名、简介、导航菜单都在 `src/lib/site.ts`，只改这一个文件。
上线后记得把里面的 `url` 填成你的正式域名。

## 设计说明

整体走**极简约束**路线：近乎单色的中性灰阶，全站只用一种强调蓝，
靠留白和细分割线组织信息，不做阴影和多色装饰。明暗两套配色跟随系统。

三个交互特性：

| 特性 | 实现 | 说明 |
| --- | --- | --- |
| 文章目录 | `table-of-contents.tsx` | 桌面端贴在正文右侧，滚动时高亮当前小节；移动端收进折叠按钮 |
| 阅读进度条 | `reading-progress.tsx` | 顶部 1.5px 细线，用 `rAF` 节流避免滚动掉帧 |
| 悬停微交互 | `post-card.tsx` | 列表项悬停时泛底色、横线延展、摘要和标签淡入 |
| 正文宽度调节 | `post-body.tsx` | 文章页可切换窄/标准/宽三档，选择记在 localStorage |
| 代码高亮 | `next.config.ts` + Shiki | 构建期高亮，明暗双主题跟随系统，零客户端 JS |
| 代码块交互 | `code-block.tsx` | 复制按钮、语言标签、横向滚动渐变提示 |

改配色只需动 `globals.css` 顶部的 CSS 变量，明暗两套值一一对应。

### 代码高亮与复制

代码块由 **Shiki**（VS Code 同款引擎）在**构建期**完成高亮，产物就是静态 HTML，
不加载任何客户端 JS。

**明暗双主题**：`next.config.ts` 里设了 `defaultColor: false`，Shiki 会给每个 token
同时写出 `--shiki-light` 和 `--shiki-dark` 两套颜色，由 CSS 按系统配色选用：

```css
@media (prefers-color-scheme: light) {
  .code-block pre[data-theme*=" "],
  .code-block pre[data-theme*=" "] span {
    color: var(--shiki-light);
  }
}
```

这段规则有两个容易踩的点：

- **`span` 也必须匹配**。只给 `pre` 设 `color` 的话，代码会全部继承同一个颜色，
  看起来像没高亮。
- **不能取 Shiki 自带的背景色**。github-light 是纯白、github-dark 是 `#24292e`，
  直接用会让代码块和站点的 `--surface` 脱节、破坏整体配色。
  背景统一由 `.code-block pre` 提供，只借用它的语法配色。

**语言标记**：不写的话会被当作纯文本（不着色，但仍显示复制按钮）。
支持 `ts` `tsx` `js` `jsx` `json` `bash` `css` `html` `md` `mdx` `python` `rust` 等。

**复制按钮**：悬停或键盘聚焦时显示，点击后变「已复制」两秒。
注意浏览器剪贴板 API 只在 HTTPS / localhost 可用，局域网 IP 以 http 访问时会静默失败，
此时仍可手动选中复制。

### 正文宽度调节

文章页头部有一条宽度控制条，三档循环切换：

| 档位 | 正文宽度 | 每行约 |
| --- | --- | --- |
| 窄 | 36rem | 34 字 |
| 标准 | 52rem | 49 字 |
| 宽 | 68rem | 64 字 |

三档**等距**，每档相差 16rem。跨度必须一致，否则切档时忽大忽小手感不对。

最宽档是算出来的：桌面端正文(68rem) + 目录侧栏(16rem) + 间距(3rem)
= 87rem ≈ 1392px，占顶栏内容区(1744px)的 79.8%。

用 rem 而不是 px，因为中文是全角字宽，px 宽度在不同字号下对应的字数会飘。
档位存在 `localStorage` 的 `fbz-reading-width`，刷新和跨页都保持。

实现上有两个坑值得注意：

- **宽度状态只能在一个组件里维护**。切换按钮和正文容器如果各自调用
  `useReadingWidth()`，那是两个互不相干的 state，点按钮正文不会变宽。
- **正文容器要用 `w-full` 而不是 `flex-1`**。`flex-1` 会把元素撑满可用空间，
  `maxWidth` 就形同虚设，三档会看起来一模一样。

读取偏好用 `useSyncExternalStore` 而非 `useState + useEffect`：后者需要在挂载后
同步 setState 读一次偏好，会多渲染一轮并触发 `react-hooks/set-state-in-effect` 警告。

顶栏、底栏、正文三者的内容宽度上限统一由 `CONTENT_MAX_WIDTH`（`src/lib/site.ts`）
控制，保证左右严格对齐。

**目录锚点的一致性**：`rehype-slug` 用 `github-slugger` 生成标题 id，
所以 `getTableOfContents()` 也用同一个库算 slug，锚点跳转才可靠。
`pnpm test` 会拿真实渲染的 HTML 对比验证这一点。

## 技术说明

- **Turbopack 是默认的**，`next.config.ts` 里的 remark/rehype 插件必须写**字符串名**（如
  `"remark-gfm"`），因为 Turbopack 无法把 JavaScript 函数传给 Rust
- **Next.js 16 中 `params` 是 Promise**，必须 `await`；类型直接用全局的
  `PageProps<'/blog/[slug]'>`，不用手写
- 文章页和标签页用 `generateStaticParams` 在构建时预渲染，部署到静态托管即可
- 正文样式在 `globals.css` 的 `.prose` 块里，通过后代选择器作用于 MDX 生成的裸 HTML
- 滚动高亮用 `IntersectionObserver` 而非监听 scroll 计算位置，长文滚动更顺滑

## 部署

还没配部署，本地跑通即可。需要上线时告诉我目标平台
（GitHub Pages / Vercel / Cloudflare），我再补配置。