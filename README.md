# 风不止的个人博客

Next.js 16 + TypeScript + Tailwind CSS v4 搭建的个人博客，中文界面，MDX 写作。

## 快速开始

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器 http://localhost:3000
pnpm test:server  # 一键启动测试服务器（Windows，默认 http://localhost:3000）
pnpm build       # 生产构建（会预渲染成静态 HTML）
pnpm start        # 预览生产构建

pnpm typegen     # 生成路由类型（全新克隆必须先跑，见下）
pnpm typecheck   # 类型检查
pnpm lint        # 代码检查
pnpm test        # 目录锚点一致性测试（需先启动 dev server）
```

> **全新克隆后先跑 `pnpm typegen`，否则 `pnpm typecheck` 会报一堆
> `Cannot find name 'PageProps'`。**
>
> `PageProps` / `LayoutProps` 是 Next.js 生成到 `.next/types/` 的路由类型，
> 经 `next-env.d.ts` 引入，而后者在 `.gitignore` 里（自动生成物）。
> 跑过 `pnpm dev` 或 `pnpm build` 之后生成物就在了，所以日常开发不会遇到，
> 只有在新机器上才会撞到。CI 里也是先 `typegen` 再 `typecheck`。

### 一键启动测试服务器（Windows）

```powershell
pnpm test:server
```

脚本会检查依赖是否已安装，然后启动 Next.js 开发服务器。可以通过参数指定端口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-test-server.ps1 -Port 3001
```

按 `Ctrl+C` 停止服务器。

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
│   ├── site-logo.tsx       顶栏站点标识（占位圆形图标）← 换正式 logo 看这里
│   ├── site-chrome.tsx     顶栏 / 底栏
│   ├── theme-toggle.tsx    明暗切换开关
│   └── reading-progress.tsx 顶部阅读进度条
├── lib/
│   ├── posts.ts            读取 content/ 的工具函数
│   ├── site.ts             站名、导航、CONTENT_MAX_WIDTH ← 改站点信息看这里
│   ├── theme.ts            主题的类型 / 存储键 / 首帧前生效的内联脚本
│   ├── use-theme.ts        主题的读写、切换、订阅
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
  publishedAt: "2026-10-07T20:30", // 可选；同一天多篇文章时按发布时间排序
  description: "一句话摘要",         // 列表页和分享卡片会显示
  tags: ["技术", "随笔"],           // 可选
  draft: false,                    // 可选，true 时不显示在列表和构建产物里
}

# 正文从这里开始

支持 **Markdown** 全部语法，还可以用 `代码块`、表格、引用、任务列表。
```

保存后浏览器会自动刷新，首页和列表页立刻能看到。

文章默认按 `date` 倒序排列。若同一天有多篇文章，可增加 `publishedAt`（ISO 8601
格式，例如 `2026-10-07T20:30`）来明确先后；没有填写的文章会回退到 `date`，
最后再按 slug 排序以保证顺序稳定。

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
靠留白和细分割线组织信息，不做阴影和多色装饰。明暗两套配色默认跟随系统，
顶栏右侧的开关可以手动覆盖。

顶栏左侧不是站名文字，而是一枚 **32px 圆形占位图标**（底色 `--foreground`、
字 `--background`，和明暗切换开关的滑块同一套配色逻辑）。站名仍然出现在
浏览器标题、首页大标题和页脚里，所以只是顶栏不重复它而已。

换正式 logo 只改一个文件 `src/components/site-logo.tsx`：把里面的 `<span>`
换成 `<Image>` 或 SVG 即可，32px 尺寸和圆形裁切都由 `.site-logo-badge` 负责。
注意链接里没有可读文字了，`aria-label` 必须保留，否则读屏只会念出「链接」。

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
| 代码高亮 | `next.config.ts` + Shiki | 构建期高亮，明暗双主题跟随主题开关，零客户端 JS |
| 代码块交互 | `code-block.tsx` | 复制按钮、语言标签、长代码折叠、横向滚动渐变提示 |
| 明暗切换 | `theme-toggle.tsx` + `lib/use-theme.ts` | 顶栏右侧开关；默认跟随系统，手动选择存 localStorage，刷新不闪白 |
| 站点标识 | `site-logo.tsx` | 顶栏左侧 44px 热区的圆形占位图标，换成正式 logo 只改这一个文件 |

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

**面板不要嵌套。** 需要「标题 + 可折叠内容」时，用**同一个** `.panel` 把标题行和
内容一起装下（移动端目录就是这么做的），不要标题一个面板、内容再套一个带圆角的
面板——两块圆角上下紧贴时，接缝左右会各露出一个内凹的弧度，看起来是两个圆角块
硬拼在一起，而不是一个能折叠的整块。只有代码块、标签这类需要「叠在别的面板之上」
的元素才用 `.panel-raised`，而且它们要有自己的内边距和独立位置。

### 明暗主题

配色改动只有一个入口：`globals.css` 顶部那两组 CSS 变量（浅色在 `:root`，
深色跟着主题走）。改一处记得看下面的「两处深色令牌」。

主题有两个来源，优先级是**手动选择 > 系统偏好**：

| 通道 | 触发方式 | 实现 |
| --- | --- | --- |
| 系统偏好 | 用户没点过开关 | `@media (prefers-color-scheme: dark)` |
| 手动选择 | 点顶栏开关 | `<html data-theme="light\|dark">` + localStorage |

**为什么状态放在 `<html>` 的属性上而不是 React 里**：内联引导脚本
（`lib/theme.ts` 里的 `THEME_INIT_SCRIPT`，被 `layout.tsx` 内联进 `<head>`）
在浏览器解析 HTML、**首次绘制之前**就把 `data-theme` 和 `color-scheme` 写好了，
CSS 直接出效果。如果让 React 状态决定外观，服务端只能渲染一种主题，
选了深色的用户每次刷新都会先闪一帧白底。React 那边只负责 `aria-checked`
和点击——开关滑块的位置也是 CSS 按属性算的，两边不会打架。

脚本必须放在 `<head>`：放在 body 里虽然也早于首次绘制，但如果 React 在
客户端导航时用 JS 插入它，脚本不会执行。`<html>` 上加了
`suppressHydrationWarning`，因为脚本改的属性 JSX 里没有，React 水合时会当成不一致。

开关本体（`theme-toggle.tsx`）：按钮是 44×44 的触控热区，里面才是 44×24 的胶囊轨道，
滑块和图标都复用现有令牌（轨道 `--border`、滑块 `--foreground`、当前主题的图标反白），
没有引入新颜色。

**两处深色令牌**：CSS 没有语法能把同一个声明块同时挂在媒体查询和属性选择器上，
所以 `globals.css` 里深色令牌写了两遍（各带注释标了「第一份 / 第二份」），
要改配色必须同时改。代码高亮的 Shiki 双主题规则同理，也是两份。

`prefers-reduced-motion: reduce` 下滑块动画自动归零（全局规则覆盖）。

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

### 代码高亮、复制与折叠

代码块由 **Shiki**（VS Code 同款引擎）在**构建期**完成高亮，产物就是静态 HTML，
不加载任何客户端 JS。

**明暗双主题**：`next.config.ts` 里设了 `defaultColor: false`，Shiki 会给每个 token
同时写出 `--shiki-light` 和 `--shiki-dark` 两套颜色，由 CSS 按当前主题选用
（浅色是默认值，深色有「系统偏好」和「手动选择」两个入口，见上面的明暗主题一节）：

```css
.code-block pre[data-theme*=" "],
.code-block pre[data-theme*=" "] span {
  color: var(--shiki-light);
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

**复制按钮**：常驻在工具条右侧，点击后变「已复制」两秒。
注意浏览器剪贴板 API 只在 HTTPS / localhost 可用，局域网 IP 以 http 访问时会静默失败，
此时仍可手动选中复制。

**折叠长代码**：渲染高度超过 420px 的代码块，工具条上会多一个「折叠 / 展开」按钮，
默认展开。收起时 `pre` 用 `max-height: 18rem` 截断并加一层底部渐变。
短代码块不给这个按钮。

两个按钮都常驻，不靠 hover 才浮现。折叠和复制都是需要主动去找的功能，
藏起来等于让大部分人不知道它们存在；默认只给 `--muted` 的颜色，
悬停时才浮出底色和边框。

门槛读的是 `pre.scrollHeight`：它返回内容总高、不受 `max-height` 影响，
所以收起状态下量到的仍是完整高度，按钮不会因为自己把内容压短了就消失。

折叠只压高度、不动代码本身，横向仍然可以滚。`overflow-y` 必须显式写 `hidden`，
因为另一轴是 `auto` 时纵向会被规范算成 `auto`，那样折叠块自己长出滚动条就没意义了。

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

站点是**纯静态**的，托管在 Cloudflare Pages，正式域名 <https://blog.mclll114.me>。

### 静态导出开关

`next.config.ts` 里导出行为由环境变量 `NEXT_OUTPUT` 控制：

```bash
NEXT_OUTPUT=export pnpm build   # 产出 out/，供 Cloudflare Pages 部署
pnpm build                      # 本地普通构建，pnpm start 可正常预览
```

**不能无条件写 `output: "export"`**：静态导出后产物里没有 Node 服务器，
`pnpm start` 会直接失效，本地就没法预览了。用环境变量隔开，
两条命令各管各的场景。

导出时同时开了 `trailingSlash: true`，产物是目录形式
（`/about/index.html` 而不是 `/about.html`）。这样任何静态托管或 CDN 都能
零配置映射「目录 → index.html」，日后要加国内 CDN 镜像时路径规则天然一致。

导出时还开了 `images: { unoptimized: true }`。`next/image` 默认会把图片地址
改写成 `/_next/image?url=...` 指向服务端的优化接口，静态产物里没有这个路由，
图片会**静默 404**（顶栏 logo 曾经就这么丢的）。注意本地 `pnpm dev` 走优化器、
线上走原图，两者渲染结果不同，改图片相关代码后要跑一次导出构建验证。

### 持续集成

`.github/workflows/ci.yml` 在每次 push / PR 到 `main` 时跑：
全新安装 → `typegen` → 类型检查 → lint → 导出构建 → 产物断言。

它存在的意义是拦住**「本地一切正常、只有导出构建才暴露」**的问题。
已经踩过三次：

| 问题 | 为什么本地发现不了 |
| --- | --- |
| `ERR_PNPM_IGNORED_BUILDS` | `node_modules` 已存在，install 从不重跑安装脚本 |
| 顶栏 logo 404 | dev 有服务端，`/_next/image` 优化接口真实存在 |
| `Cannot find name 'PageProps'` | 跑过 dev/build，生成的类型还留在工作区 |

产物断言覆盖：基础产物存在、sitemap 非空、文章页与标签页为目录形式且
真的产出 `index.html`、无 `/_next/image` 引用、`public/` 资源已复制。

### Cloudflare Pages 后台配置

| 配置项 | 值 |
| --- | --- |
| 框架预设 | Next.js (Static HTML Export) |
| 构建命令 | `NEXT_OUTPUT=export pnpm build` |
| 构建目录 | `out` |
| 生产分支 | `main` |

DNS 用子域名接入，阿里云 DNS 保持不动，加一条 CNAME 指向
`<项目名>.pages.dev` 即可，不需要改 NS（顶级域才必须改 NS）。

### 部署后的注意事项

- **别在自定义域名上加缓存规则。** Pages 内置缓存已经够用，资产在 CDN 上
  TTL 是一周且可能随时失效；自定义缓存规则可能在部署后仍返回旧资源。
- **中文标签页要手动点一下确认。** 产物文件名是原始 UTF-8（`tags/技术/index.html`），
  而站内链接用 `encodeURIComponent` 编码。这依赖 Cloudflare 把编码路径映射回
  UTF-8 文件名——官方支持，但属于平台行为而非本项目代码保证。
- **改域名或文章后要 push 才生效。** Pages 每次推送才重新构建，
  `lib/site.ts` 里的 `url` 会进 sitemap、robots 和 OG 分享卡片。

### sitemap 与 robots

`app/sitemap.ts` 和 `app/robots.ts` 在构建期生成，域名统一取自
`lib/site.ts` 的 `siteConfig.url`——**只有这一个来源**，改域名只改那一处。

两个文件都必须写 `export const dynamic = "force-static"`：静态导出下
元数据路由不显式声明就会构建失败（`not configured on route "/robots.txt"`）。

### 404 页

`src/app/not-found.tsx`。Next 的默认 404 只有一行英文
「This page could not be found.」，和中文站完全不搭，也没给出路。
这里补上中文说明、三个出口（首页 / 全部文章 / 标签）和搜索快捷键提示。

静态导出会生成 `out/404.html`，Cloudflare Pages 找不到资源时自动回落到它。
文章详情页调用 `notFound()` 时同理——那种页面根本不会被生成，
访客拿到的就是这个 404。

### 国内访问

Cloudflare 免费版**没有中国大陆节点**，绑定自有域名只是降低被干扰概率，
不等于加速——境内访问仍会绕到香港/日本节点。要真正解决必须境内服务器
加 ICP 备案，免费方案做不到这一点。

---

## 评论

文章底部的留言区是**全站唯一的动态部分**。页面本身仍是静态导出的 HTML，
评论在浏览器里向 `/api/comments` 取。

### 为什么静态站也能有后端

Cloudflare Pages 允许在仓库根目录放一个 `functions/` 目录，它会被单独
部署成 Worker。关键点是**它与构建产物目录是两回事**——官方文档明确要求
`functions/` 放在项目根目录，**不能放进静态产物目录**（如 `out/`）：

> Make sure that the `/functions` directory is at the root of your Pages
> project (and not in the static root, such as `/dist`).

所以 `output: "export"` 照旧，Next.js 自己的服务端能力（Route Handler、
cookies、Server Actions）依然不可用，但 `functions/` 这一层不受影响。

```
functions/_lib/api.js       共用模块：CORS、限流、校验、IP 哈希
functions/api/comments.js   评论接口
db/schema.sql               D1 建表语句
wrangler.toml               Pages 配置与 D1 绑定
```

数据存在 **Cloudflare D1**（边缘 SQLite）。免费额度为每天 500 万行读、
10 万行写、5 GB 存储，且无出网费——个人博客用不到零头。

### 接口

```
GET    /api/comments?page=<slug>                       列出留言（最多 200 条）
POST   /api/comments   { page, name, text, parent_id? } 发表留言或回复
DELETE /api/comments?id=<id>&key=<ADMIN_KEY>           管理员删除（级联删回复）
```

`parent_id` 不传就是顶层留言；传了表示回复，详见下面的「回复」。

### 回复

**只做两层。** 回复「回复」时后端会把 `parent_id` 归一到根留言
（见 `_lib/api.js` 的 `resolveReplyTarget`），于是它成为同一层里的兄弟回复。

这么选是因为无限嵌套在手机屏上缩进几层就没法读，而且深树会让
「删除中间层」的语义变含糊——那到底删这一条，还是连它下面一串？

接口层还校验回复目标**必须存在且属于同一篇文章**，否则可以构造一个
`parent_id` 把回复挂到别的文章下面去。

**删除是级联的**：删顶层留言时连同它所有回复一起删（`deleteCommentCascade`），
且必须**先删子行再删父行**——反过来父行没了，子行的 `parent_id` 就指向一个
不存在的 id，那些回复会变成永远显示不出来的孤儿数据。后台的二次确认会
提示「该留言下的 N 条回复会一并删掉」。

### 设计取舍

- **不做登录。** 匿名 + 昵称 + 限流足够，引入账号体系会让大多数想留言的人放弃。
  昵称可留空，记作「路人」。
- **不存 IP。** 只存加盐 SHA-256 哈希，仅用于限流；数据库里不留访客真实 IP。
- **限流**：同一 IP 10 分钟内最多 3 条（回复同样计数）。
- **管理**：登录与删除都需要 `ADMIN_KEY`，前端不持有。密钥比较用常量时间，
  避免通过响应时间差逐位猜出密钥。

### 两种管理入口

| 入口 | 场景 |
| --- | --- |
| `/admin` | 跨文章浏览全部留言、搜索、分页 |
| 文章页评论区 | 登录后每条旁边直接出现「删除」，就地管理 |

文章页那套靠一次 `/api/admin/session` 探测身份：对普通访客是多余的一次请求，
但它只做签名校验、不查库，代价可以忽略；换来的是管理员打开任意文章页
就能直接管理，不需要任何额外入口。

### 数据库迁移

`db/schema.sql` 只负责**全新安装**——`CREATE TABLE IF NOT EXISTS` 不会给已存在
的表加列。已有数据的库要跑 `db/migrations/` 下的脚本：

```bash
# 本地
npx wrangler d1 execute fbz-blog-comments --local  --file=db/migrations/0001-add-parent-id.sql
# 线上
npx wrangler d1 execute fbz-blog-comments --remote --file=db/migrations/0001-add-parent-id.sql
```

`parent_id` 允许为 NULL，所以迁移不需要回填，已有留言自动成为顶层留言。

### 本仓库当前已配置好

D1 数据库已创建（区域 APAC），`wrangler.toml` 里的绑定指向它，
`db/schema.sql` 也已在远程库执行完毕。密钥通过 wrangler 设置：

```bash
# 查看已设置的密钥（值不回显）
npx wrangler pages secret list --project-name fbz-personal-blog

# 更换管理员密钥（改完需要重新部署才生效）
echo "你的新密钥（至少 16 位）" | npx wrangler pages secret put ADMIN_KEY --project-name fbz-personal-blog
```

> **改动密钥或绑定后必须重新部署**：Pages 的环境变量和密钥在部署时注入，
> 推一次 commit 即可触发。

### 从零重建的步骤

换了账号或想重建时按这个顺序：

**1. 创建 D1 数据库**

```bash
npx wrangler login
npx wrangler d1 create fbz-blog-comments
```

把输出的 `database_id` 填进 `wrangler.toml` 的 `[[d1_databases]]`。

> 这一步不能省着随便填：`database_id` 必须指向真实存在的库，
> 否则 Cloudflare 会因为找不到数据库而让**部署失败**。
> 本仓库最初就是先把这段注释掉、等建库后再启用的。

**2. 建表**

```bash
npx wrangler d1 execute fbz-blog-comments --remote --file=db/schema.sql
```

**3. 配置密钥**

```bash
echo "至少 16 位的随机串" | npx wrangler pages secret put ADMIN_KEY --project-name fbz-personal-blog
echo "另一串随机字符"     | npx wrangler pages secret put IP_SALT   --project-name fbz-personal-blog
```

也可以走 Cloudflare 后台 → Pages 项目 → 设置 → 变量与机密，效果相同。

| 变量名 | 说明 |
| --- | --- |
| `ADMIN_KEY` | 管理员登录密钥。**至少 16 位**，短于 16 位会被拒绝登录 |
| `IP_SALT` | 给 IP 哈希加的盐，随便设一串长的 |

可选的第三个：

| 变量名 | 说明 |
| --- | --- |
| `SESSION_SECRET` | 单独给登录 Cookie 签名用。不配就复用 `ADMIN_KEY` |

### 管理后台

| 地址 | 用途 |
| --- | --- |
| `/adminlogin` | 登录页 |
| `/admin` | 留言管理（列表、搜索、删除） |

**两个页面都没有任何入口链接**——导航栏、页脚、sitemap 里都不放，
只能靠记住地址访问。同时做了两道「别被收录」的防护：
`robots.txt` 里 `Disallow: /admin`、`/adminlogin`，页面本身带 `noindex`。
前者只约束守规矩的爬虫，后者才是真正的信号。

管理页是静态导出的 HTML，**任何人都能打开这个地址**——
真正的门在 `/api/admin/*` 上：未登录时接口一律返回 401，
页面拿不到数据并跳回登录页。所以这里不需要也没法做服务端鉴权。

功能：按昵称/内容/文章标识搜索（300ms 防抖）、分页、两步确认删除、
退出登录。

### 登录态的实现

用 **HMAC 签名的 HttpOnly Cookie**，服务端不存任何会话记录：

- Cookie 内容只有过期时间和签名（`<过期时间戳>.<HMAC-SHA256>`），
  验签即可，无需查库；水平扩容也没有一致性问题
- **HttpOnly**：JavaScript 读不到，XSS 偷不走
  （这也是不用 localStorage 存 token 的原因）
- **SameSite=Strict**：跨站请求不带它，顺带挡掉 CSRF
- **Secure 只在 https 下加**：本地 `wrangler pages dev` 跑在 http://127.0.0.1，
  带上 Secure 浏览器会直接丢弃 Cookie，表现为「登录成功却仍是未登录」
- 有效期 7 天

其他防护：密钥比较用常量时间；登录失败固定延迟 400ms 抬高暴力破解成本；
`ADMIN_KEY` 短于 16 位直接拒绝登录；管理接口响应一律 `no-store`，
避免未登录者命中有权限的缓存响应。

**4. 推送**

`wrangler.toml` 里的绑定生效后，重新部署即会挂上 D1。

### 本地调试

`pnpm dev` 跑的是 Next 开发服务器，**不会**启动 `functions/`，
评论会显示「评论服务尚未配置」。要连后端一起调：

```bash
# 1. 先出一份静态产物（Windows PowerShell 写法）
$env:NEXT_OUTPUT="export"; pnpm build
#   Git Bash / macOS / Linux：NEXT_OUTPUT=export pnpm build

# 2. 建本地库的表（只需一次）
npx wrangler d1 execute fbz-blog-comments --local --file=db/schema.sql

# 3. 起 Pages 开发服务器（带 functions）
pnpm preview:cf      # http://127.0.0.1:8788
```

本地密钥放在 `.dev.vars`（已在 `.gitignore` 里，不会提交）：

```
ADMIN_KEY=local-dev-admin-key
IP_SALT=local-dev-salt
```

### 用命令行删一条留言

不想开后台时可以直接调接口（需要 `ADMIN_KEY`）：

```bash
curl -X DELETE "https://blog.mclll114.me/api/comments?id=<id>&key=<ADMIN_KEY>"
```

> 本地管理后台：<http://127.0.0.1:8788/adminlogin>。
> `.dev.vars` 里的 `ADMIN_KEY` 同样受「至少 16 位」约束，否则登录会被拒。