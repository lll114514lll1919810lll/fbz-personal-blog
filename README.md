# 风不止的个人博客

一个使用 Next.js、TypeScript、Tailwind CSS 和 MDX 搭建的中文个人博客，
页面静态导出后部署在 Cloudflare Pages，评论走 Pages Functions + D1。

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
| `pnpm typegen` | 生成 Next.js 路由类型（`PageProps` / `LayoutProps`） |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 检查文章目录锚点 |
| `pnpm test:theme` | 检查主题相关 CSS |
| `pnpm test:server` | 在 Windows 上启动测试服务器（`scripts/start-test-server.bat`，可加端口参数，如 `pnpm test:server -- 3001`） |
| `pnpm preview:cf` | 用 wrangler 本地预览静态产物 + 评论接口 |

全新克隆后建议先运行 `pnpm typegen && pnpm typecheck`。

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
- 元信息使用 MDX 的 `export const metadata`，不是 YAML frontmatter。
- 不要在正文开头再写一级标题，文章页已经用 `metadata.title` 渲染了标题。
- 支持 Markdown、GFM 表格、任务列表、代码块和 JSX。
- 正文默认按 `CC BY-NC-SA 4.0` 发布，见 [CONTENT-LICENSE.md](./CONTENT-LICENSE.md)。

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
scripts/          测试与审计脚本
public/           图片和其他静态资源
```

站名、简介、域名、导航和仓库地址集中在 `src/lib/site.ts`，通常只需要修改
这个文件。

## 部署

页面构建为纯静态文件后交给 Cloudflare Pages（构建目录设为 `out`）：

```bash
# PowerShell
$env:NEXT_OUTPUT="export"; pnpm build

# Bash
NEXT_OUTPUT=export pnpm build
```

本地 `pnpm dev` 不加这个变量，行为和普通 Next.js 开发一致；导出模式下
`next/image` 优化器会被关闭，改图片相关代码后务必跑一次导出构建验证。
仓库中的 CI 会依次执行依赖安装、类型生成、类型检查、lint、静态导出和
产物断言。

### 评论与后台

评论功能需要 Cloudflare D1（绑定名 `DB`，见 `wrangler.toml`）和
`.dev.vars` 中的 `ADMIN_KEY`、`IP_SALT`，密钥不要提交到仓库。本地预览
评论接口：

```bash
npx wrangler d1 execute fbz-blog-comments --local --file=db/schema.sql
pnpm preview:cf
```

- 管理员登录 `/admin` 后可管理留言、给留言挂「管理员」徽标、用「接受新
  评论」开关锁全站评论。锁的状态存在 D1 的 `settings` 表里。
- 已有数据库需要按顺序补跑迁移：`db/migrations/` 下的
  `0002-add-admin-badge.sql` 和 `0003-add-settings.sql`（本地加
  `--local`，线上加 `--remote`），漏跑 0003 会让评论锁显示「状态未知」。

## 第三方组件

完整的使用与鸣谢清单见站内[「关于」页](https://blog.mclll114.me/about)。
液态玻璃部分的来源、协议和对上游的改动记录在
[src/components/liquid-glass/README.md](./src/components/liquid-glass/README.md)。

## 授权

| 范围 | 协议 |
| --- | --- |
| 主题、组件、配置和脚本等源码 | [AGPL-3.0](./LICENSE) |
| `src/content/` 中的文章正文 | [CC BY-NC-SA 4.0](./CONTENT-LICENSE.md) |
| 文章中自己写的代码片段 | 按 MIT 处理 |
| `src/components/liquid-glass/`（第三方） | [AGPL-3.0](https://github.com/martin65536/liquid-glass-webgl) |

源码可以修改和商用，但衍生作品要同样开源，并且通过网络提供服务时要把
源码提供给使用者（本站源码公开，底栏与「关于」页都有链接）。文章转载、
翻译和改写需要署名、不得商用，衍生作品使用同一协议。

代码是 AGPL 的原因：站点集成了
[liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl)
（AGPL-3.0）的液态玻璃渲染器。AGPL 的源码公开义务覆盖整个服务，不能只把
那一个组件单独标注，因此全站源码按 AGPL-3.0 发布。2026-10-09 之前的提交
按 MIT 发布，那部分授权不因这次变更而收回。
