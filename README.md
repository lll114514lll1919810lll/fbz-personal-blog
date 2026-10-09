# 风不止的个人博客

一个使用 Next.js、TypeScript、Tailwind CSS 和 MDX 搭建的中文个人博客。

## 快速开始

需要 Node.js 和 pnpm：

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000> 查看站点。常用命令：

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 执行生产构建 |
| `pnpm start` | 预览普通生产构建 |
| `pnpm typegen` | 生成 Next.js 路由类型 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 检查文章目录锚点 |
| `pnpm test:theme` | 检查主题相关 CSS |
| `pnpm test:server` | 在 Windows 上启动测试服务器 |

全新克隆后建议先运行：

```bash
pnpm typegen
pnpm typecheck
```

`PageProps` 和 `LayoutProps` 是 Next.js 自动生成的类型；`pnpm dev` 或
`pnpm build` 也会生成它们。

Windows 上可以用脚本启动测试服务器并指定端口：

```powershell
pnpm test:server
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-test-server.ps1 -Port 3001
```

## 写文章

在 `src/content/` 新建 `.mdx` 文件。文件名就是文章 URL 的 slug，例如
`my-first-post.mdx` 对应 `/blog/my-first-post`。

```mdx
export const metadata = {
  title: "文章标题",
  date: "2026-10-09",
  publishedAt: "2026-10-09T20:30",
  description: "一句话摘要",
  tags: ["建站", "技术"],
  draft: false,
}

正文从这里开始。文章页会自动渲染标题、日期、阅读时长、标签和目录。
```

注意：

- `date` 必填，格式为 `YYYY-MM-DD`；同一天的文章可用 `publishedAt` 排序。
- `draft: true` 的文章不会出现在列表和静态构建结果中。
- 不要在正文开头再写一级标题，文章页已经使用 `metadata.title` 渲染了标题。
- 元信息使用 MDX 的 `export const metadata`，不是 YAML frontmatter。
- 支持 Markdown、GFM 表格、任务列表、代码块和 JSX。
- 正文默认按 `CC BY-NC-SA 4.0` 发布，具体条款见 [CONTENT-LICENSE.md](./CONTENT-LICENSE.md)。

## 目录结构

```text
src/
├── app/          页面和路由
├── components/   站点外壳、文章、目录、搜索、评论等组件
├── content/      MDX 文章
├── lib/          文章读取、站点配置、主题和阅读宽度等工具
└── globals.css   全局样式和文章排版
functions/        Cloudflare Pages Functions（评论和管理接口）
db/               D1 数据库结构与迁移
public/           图片和其他静态资源
```

站名、简介、域名、导航和仓库地址集中在 `src/lib/site.ts`，通常只需要修改
这个文件。

## 部署

站点的页面可以导出为纯静态文件，当前部署目标是 Cloudflare Pages：

```bash
# PowerShell
$env:NEXT_OUTPUT="export"; pnpm build

# Bash
NEXT_OUTPUT=export pnpm build
```

构建产物在 `out/`，Cloudflare Pages 的构建目录也应设置为 `out`。仓库中的
CI 会依次执行依赖安装、类型生成、类型检查、lint、静态导出和产物断言。

本地预览包含评论接口时：

```bash
npx wrangler d1 execute fbz-blog-comments --local --file=db/schema.sql
pnpm preview:cf
```

评论功能需要 Cloudflare D1 和 `.dev.vars` 中的 `ADMIN_KEY`、`IP_SALT`；
密钥不要提交到仓库。评论、管理后台和数据库迁移的完整操作以项目实际配置为准。

管理员登录后可在后台逐条给留言挂一枚金色「管理员」徽标（显示在昵称旁，
用于标出站方自己的回复）。开关走 `PATCH /api/admin/comments`，访客的发表
接口不接收这个字段，伪造不了。已有数据库需要跑一次
`db/migrations/0002-add-admin-badge.sql` 加列。

## 实验室

底栏右端有一个「实验室」（`/lab`）入口，用来放还没定稿的外观实验。
选择只存在访问者自己的浏览器里（`localStorage`），默认全默认，恢复默认后
页面立刻变回去。

实验清单在 `src/lib/labs.ts` 的 `LABS` 里，目前支持三种形态：

| 形态 | 说明 |
| --- | --- |
| `kind: "switch"` | 开关型，开 / 关两态 |
| `kind: "choice"` | 档位型，从固定几档里选一个（页面用原生 `<select>`） |
| `group` | 互斥组：同组实验只能开一个，开了新的会自动关掉旧的 |
| `runtime` | 需要客户端代码才生效的实验（WebGL 那类），由 `components/lab-runtimes.tsx` 挂载 |

状态写在 `<html>` 上，每个实验一个属性：`data-lab-flat="on"`、
`data-lab-corners="round"`；默认档不写属性。属性由 `lib/labs.ts` 的内联脚本
在首次绘制前写好，所以刷新也不会闪一帧默认外观。

加一个纯 CSS 的实验只需动两个地方：`LABS` 里加一项，再在
`src/app/globals.css` 末尾加一段 `:root[data-lab-<id>="<值>"]` 的覆盖规则。
运行时型的实验还要在 `lab-runtimes.tsx` 里注册一个组件。

目前唯一一个运行时实验是「液态玻璃」：用
[liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl) 的
WebGL 渲染器（AGPL-3.0）画一层玻璃；**超长文章的面板**（那种几千到几万像素
高的）另走一条便宜的 SVG 滤镜路线，来自
[shuding/liquid-glass](https://github.com/shuding/liquid-glass)（MIT）——
不用 WebGL，一条 `backdrop-filter` 交给合成器，位图只生成一次。

接线上没有用上游自带的宿主组件——那套要求把整个界面描述成
`GlassElementConfig[]`，连文字和滚动都在它的 canvas 里，照做就得把整站
重写一遍，还会丢掉 SEO、可访问性、复制粘贴。这里只实例化它的
`LiquidGlassRenderer`，当成「一层玻璃画布」铺在正文下面：画布画
「背景图 + 每块面板位置上的玻璃」，正文依旧是真实 DOM 并压在玻璃上，
所以文字仍可选中、可搜索、可被搜索引擎读到。

渲染器与 shader 原样放在 `src/components/liquid-glass/`，来源、协议和
我们对上游做过的类型修补都记在那个目录的 `README.md` 里。

代价是整站源码因此按 AGPL-3.0 发布（见下面的说明），另外它需要 WebGL，
老设备上可能掉帧。

观感与性能都还不理想：底板每帧都要重算，滚动会掉帧；玻璃块数一多，还要
按屏幕预算往下砍。留着是为了先占住实验的位置，之后再换更省的做法。

观感与性能都还不理想：底板每帧都要重算，滚动会掉帧。留着是为了先占住
实验的位置，后面再换更省的做法。

## 设计说明

博客的视觉、交互和静态架构取舍，集中写在站内文章：

**[把博客做成一份安静的阅读界面：风不止个人博客的设计说明](./src/content/6-blog-design.mdx)**

## 授权

| 范围 | 协议 |
| --- | --- |
| 主题、组件、配置和脚本等源码 | [AGPL-3.0](./LICENSE) |
| `src/content/` 中的文章正文 | [CC BY-NC-SA 4.0](./CONTENT-LICENSE.md) |
| 文章中自己写的代码片段 | 按 MIT 处理 |
| `src/components/liquid-glass/`（第三方） | [AGPL-3.0](https://github.com/martin65536/liquid-glass-webgl) |

简单说：源码可以修改和商用，但衍生作品要同样开源，并且通过网络提供服务时
要把源码提供给使用者（本站源码公开，底栏与「关于」页都有链接）；文章转载、
翻译和改写需要署名、不得商用，衍生作品使用同一协议。

### 为什么代码是 AGPL

站点集成了 [liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl)
（AGPL-3.0）的液态玻璃渲染器。AGPL 要求「通过网络提供服务时向使用者提供
完整源码」，这个义务覆盖整个服务，不能只把引入的那一个组件单独标注，因此
全站源码按 AGPL-3.0 发布。

2026-10-09 之前的提交是按 MIT 发布的，那部分授权不因这次变更而收回；
之后的版本按 AGPL-3.0。
