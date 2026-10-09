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
  tags: ["技术", "随笔"],
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

## 设计说明

博客的视觉、交互和静态架构取舍，集中写在站内文章：

**[把博客做成一份安静的阅读界面：风不止个人博客的设计说明](./src/content/6-blog-design.mdx)**

## 授权

| 范围 | 协议 |
| --- | --- |
| 主题、组件、配置和脚本等源码 | [MIT](./LICENSE) |
| `src/content/` 中的文章正文 | [CC BY-NC-SA 4.0](./CONTENT-LICENSE.md) |
| 文章中引用的代码片段 | 按 MIT 处理 |

简单说：主题可以修改和商用；文章转载、翻译和改写需要署名、不得商用，
衍生作品使用同一协议。
