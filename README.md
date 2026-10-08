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
│   ├── how-to-write-with-mdx.mdx
│   └── code-blocks-guide.mdx
├── components/
│   ├── site-chrome.tsx     页头 / 页脚
│   ├── post-card.tsx       文章列表卡片（悬停微交互）
│   ├── post-body.tsx       文章主体 + 宽度调节条
│   ├── post-navigation.tsx 上一篇 / 下一篇
│   ├── table-of-contents.tsx 文章目录（侧栏 / 折叠两种形态）
│   ├── use-active-heading.ts 目录滚动高亮的 hook
│   ├── tag-filter-bar.tsx  标签筛选栏
│   ├── code-block.tsx      代码块交互（复制 / 语言标签 / 渐变）
│   └── reading-progress.tsx 顶部阅读进度条
├── lib/
│   ├── posts.ts            读取 content/ 的工具函数
│   ├── site.ts             站名、导航、CONTENT_MAX_WIDTH ← 改站点信息看这里
│   ├── reading-width.ts    正文宽度档位 + localStorage 持久化
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
| 标签筛选 | `tag-filter-bar.tsx` | 列表页和标签页共用的筛选栏，点击跳独立地址可分享 |
| 页面过渡 | `page-transition.tsx` | React View Transitions，App Router 路由切换自动触发 |
| 点击反馈 | `link-pending.tsx` | 导航等待期间把链接压暗，确认点击生效 |
| 回到顶部 | `back-to-top.tsx` | 文章页右下角，滚过一屏后出现 |
| 目录动效 | `table-of-contents.tsx` | 展开/收起高度过渡，子项错峰滑入 |
| 缓动滚动 | `lib/scroll.ts` | 点击目录缓动滚到锚点，侧栏内部跟随 |
| 代码高亮 | `next.config.ts` + Shiki | 构建期高亮，明暗双主题跟随系统，零客户端 JS |
| 代码块交互 | `code-block.tsx` | 复制按钮、语言标签、横向滚动渐变提示 |

改配色只需动 `globals.css` 顶部的 CSS 变量，明暗两套值一一对应。

### 亚克力面板

所有内容面板都是**圆角毛玻璃**（半透明底 + `backdrop-filter` 背景模糊），
浮在页面背景之上。默认背景是纯色，看起来就是干净的面板；一旦放上背景图，
图片会从面板下面透出来，文字仍然清晰。

三档面板底色，按「需要多实」区分：

| 类名 | 不透明度（浅/深） | 用在哪 |
| --- | --- | --- |
| `.panel` | 0.72 / 0.74 | 卡片、目录侧栏 |
| `.panel-strong` | 0.86 / 0.88 | 文章正文、页面标题区（长文阅读要更实的底） |
| `.panel-raised` | 0.6 / 0.62 | 代码块、标签、上下篇导航（叠在别的面板之上） |

**顶栏底栏是例外**：它们通栏、直角、贴屏幕边缘，只保留下边框 / 上边框作分隔
（`rounded-none border-x-0`）。通栏条一旦有圆角，四角会露出背景、看着像没铺满；
直角才是「贴到边缘」该有的样子。毛玻璃照旧保留。

实现上靠的是层叠顺序：`.panel` 在 `@layer components`，而 `rounded-none`、
`border-x-0` 这些工具类在 `@layer utilities` 里排在后面，能正常覆盖它——
不需要为通栏单独造一套类。

**放背景图**：把图片放进 `public/`，然后在 `globals.css` 的 `:root` 里改一行：

```css
--bg-image: url("/bg.jpg");
```

图片会以 `cover` 居中固定铺满。没有图片时（默认 `none`）一切照常。

**两个必须注意的实现细节**（都踩过）：

1. **`.panel` 必须写在 `@layer components` 里。** Tailwind v4 把工具类放在
   `@layer utilities`，而**无层样式优先级高于任何层**。写在层外的话，
   `.panel` 的 `background-color` 会永远压过 `group-hover:bg-panel-strong`，
   卡片悬停变色会静默失效。
2. **不要手写 `-webkit-backdrop-filter`。** 同时写标准和前缀两条时，
   Lightning CSS 合并这对声明会把两条都丢掉，毛玻璃整个失效。
   只写标准属性，前缀由构建工具按浏览器目标自动补。

面板令牌同时注册成了 Tailwind 主题色，所以可以用 `bg-panel` /
`bg-panel-strong` / `bg-panel-raised` / `border-panel-edge` 这些工具类。
直接用 `bg-[var(--panel-bg-strong)]` 是不行的——Tailwind 判断不出那是个颜色，
不会生成工具类，悬停态会静默失效。

无障碍：`prefers-reduced-transparency: reduce` 下退化成实色面板；
不支持 `backdrop-filter` 的浏览器同理（`@supports` 兜底）。

### 页面切换过渡

用 React 19.2 canary 的 `<ViewTransition>` 实现，App Router 路由切换本身就是
一次 transition，**不需要任何配置**。动效刻意做得很克制：淡入淡出 + 几像素
垂直位移，180ms，符合极简风格。

顶栏、底栏、阅读进度条都放在 `<ViewTransition>` **外面**，切换时保持静止——
导航不该闪烁，读者的视线重心要稳定。

有一个容易忽略的前提：**必须给 `ViewTransition` 传 `key`**，React 才会把新旧内容
当成「退出 / 进入」这一对来处理。没有 `key` 时它认为只是原地更新，
不会产生任何动画——表现是 `startViewTransition` 被调用了却看不到过渡。
这里用 `pathname` 当 key。

CSS 里还处理了两个容易被忽略的点：

- `::view-transition { pointer-events: none }` —— 动画进行中浏览器遮罩会吞掉点击，
  关掉它让点击直接落到新页面。
- `prefers-reduced-motion: reduce` 下把 view-transition 的动画时长归零。
  注意只改通用的 `animation-duration` 不够，浏览器仍会等动画结束才切换内容。

不支持 View Transitions API 的浏览器（比如部分 Safari）内容照常切换，只是没有动画。

### 点击反馈

`useLinkStatus` 必须在 `<Link>` 的**后代组件**里调用，不能直接在 `<Link>` 上用，
所以封装成了 `<LinkPending>`：导航等待期间把内容压暗到 0.45。

卡片的热区链接是空的 `<a>`（absolute inset-0 铺满整行），没有文字可压暗，
这时 `<LinkPending>` 不传 children，会自动铺满整个热区。

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

`globals.css` 里还有一条 `scrollbar-gutter: stable` 不能删：内容短的页面
（比如标签页）不会出现纵向滚动条，可用宽度就会比长页面宽一个滚动条的宽度，
页面之间切换时内容会轻微抖动。固定预留后所有页面宽度一致。

正文宽度还可以由用户在窄/标准/宽三档间切换（见上一节），
窄视口下正文自动占满并取消居中。

### 动效

全站动效集中在两处，都尊重系统的「减少动态效果」设置
（`globals.css` 末尾的 `prefers-reduced-motion` 会把它们全部归零）：

| 动效 | 实现 |
| --- | --- |
| 页面切换淡入淡出 | React View Transitions，见 `page-transition.tsx` |
| 目录展开/收起 | `grid-template-rows` 的 `0fr → 1fr` 过渡 |
| 子项错峰入场 | 每个子项依次延迟 25ms，透明度 + 位移 |
| 目录项高亮 | `transition` 覆盖颜色，滚动时高亮移动不突兀 |
| 点击目录滚动 | 缓动滚动（`lib/scroll.ts`），三次缓出曲线 |
| 侧栏内部跟随 | 高亮项离开可视区时自动滚进视野 |
| 卡片悬停 | 底色、横线延展、摘要淡入 |
| 代码块 | 悬停显现工具条、滚动条显色 |

**目录展开动画为什么用 grid 而不是 max-height**：子项数量不固定，
`max-height` 需要测量内容才知道目标值。用 `grid-template-rows: 0fr → 1fr`
可以让浏览器自己算高度，无需 JS 测量。前提是**子项列表始终挂载**——
如果写成 `{open && <ul>}` 直接卸载 DOM，就没有高度动画可言。

**目录滚动为什么不用原生锚点**：原生跳转是瞬间到位的长距离传送，眼睛跟不上。
缓动滚动把目标对齐到视口 1/3 处，既避开吸顶导航，也和目录高亮的判定标准一致。
地址栏用 `replaceState` 更新，不污染历史记录（否则后退键要多按一次）。

**回到顶部按钮**（`back-to-top.tsx`）只在文章页渲染。滚过约一屏才出现——
刚进页面就冒出一个「回到顶部」是多余的。隐藏时除了 `opacity: 0`，还要设
`tabIndex={-1}` 和 `aria-hidden`：只靠透明度隐藏的话，按钮仍可被 Tab 聚焦，
键盘用户会 tab 到一个看不见的东西。

点击后复用 `lib/scroll.ts` 的缓动滚动。它把高亮锁到**第一个小节标题**——
滚到顶时读者看到的就是第一节，这样动画结束时高亮正好落在该在的位置。

**滚动锁**（`lib/scroll.ts`）：缓动滚动会让页面依次经过起点到终点之间的每一个章节。
如果高亮照常跟随，侧栏就会从上到下一项项刷过去（实测 37 项目录会连变 36 次），
动静极大。所以跳转期间把高亮**锁定到目标项**，中间章节不参与。

锁定不会在动画结束时立刻解除——那会让高亮交还给「阅读线」判定逻辑，
而点击最底部那一节时（页面滚不动了）该逻辑会选中上面一节，高亮又回落一次。
改为**等用户真正滚动再解锁**：监听 `scroll` 事件并用 `programmatic` 标志
忽略自己产生的那些。用 scroll 而不是 wheel，因为拖滚动条、按空格、点轨道
都不触发 wheel 但都会触发 scroll。

实测：点击跳转高亮变化 0 次（一步到位）；用户滚动后正常恢复跟随。

**目录没有横向滚动条**：`overflow-y: auto` 会按 CSS 规范把 `overflow-x`
从 `visible` 计算成 `auto`，于是长英文单词或代码标识符会在底部冒出一条
横向滚动条。显式设 `overflow-x: hidden`，并给 flex 子项加 `min-w-0`
防止它把容器撑宽。

**目录文字宽度不跳动**：展开分组后内容变长才出现纵向滚动条，滚动条会占掉
约 10px 内容宽度，文字区跟着变窄——展开收起时整块文字左右跳动。
用 `scrollbar-gutter: stable` 永久预留这段空间，实测三种状态下文字宽度
恒为 226px。（`<html>` 上也有同一条规则，解决的是页面级滚动条引起的
跨页面宽度差异。）

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