# 剥离博客框架到 fblog-framework

## Context

把 `fbz-personal-blog` 的框架能力（背景、样式、界面组件、实验室全部功能、管理员后台 + 评论系统）复制到一个新的独立目录 `C:\Users\Lecoo\source\repos\fblog-framework`，做成通用博客框架模板。要求：

- 原仓库保持完全不动
- 移除顶栏头像、全面剥离个人信息（站点信息全部改为占位符）
- 博文只保留一篇新写的示例文章（放在新框架目录里）
- 保留管理员后台 + 评论系统

## 一、复制文件（原样复制，不改内容）

用 robocopy 复制，**排除**产物和本机配置目录：`node_modules`、`.next`、`.preview`、`out`、`.wrangler`、`.dev.vars`（含密钥）、`AGENTS.md`、`CLAUDE.md`、`README.md`、`CONTENT-LICENSE.md`。

复制清单：

| 内容 | 路径 |
|---|---|
| 源码 | `src/`（`src/content` 下 8 篇旧文章除外） |
| 静态资源 | `public/`（`site-logo.jpg` 除外；背景图 background-*.png、images/ 保留，背景属于框架） |
| 工程配置 | `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`tsconfig.json`、`next.config.ts`、`postcss.config.mjs`、`eslint.config.mjs`、`.gitignore` |
| 部署配置 | `wrangler.toml`、`functions/`、`db/`、`scripts/` |
| CI | `.github/workflows/ci.yml` |
| 协议 | `LICENSE`（AGPL-3.0 必须保留：liquid-glass 依赖是 AGPL） |

另新建 `.dev.vars.example`（只含键名占位，如 `ADMIN_KEY=your-admin-key`、`IP_SALT=your-salt`），不复制真实 `.dev.vars`。

## 二、剥离个人信息（改占位符）

全部个人信息出现点已通过 grep 确认（`风不止|mclll114|lll114514|但行有恒`）：

1. **`src/lib/site.ts`**：`name`/`author`/`description`/`url`/`github`/`repo`/`LICENSE.codeUrl` 全部改为占位符（如「我的博客」「博主」、空字符串），保留配置结构和大段说明注释（注释里的个人域名等字样一并清理）
2. **`src/components/site-logo.tsx`**：移除 `next/image` 头像引用，改为纯 CSS 圆点/图形标识（组件结构、aria-label 不变）——注意 CI 注释提到过 logo 用 next/image 静态导出会 404，改 CSS 方案顺带消除这个坑
3. **删除 `public/site-logo.jpg`**
4. **`src/components/site-chrome.tsx`**：页脚签名「风不止，但行有恒。」改为读 `siteConfig.description` 或删除
5. **`src/components/post-card.tsx:155`**：封面 label「风不止 / NOTES」改为通用文案
6. **`src/app/blog/page.tsx`、`src/app/blog/page/[page]/page.tsx`**：metadata description 里的「风不止」改为通用文案
7. **`src/app/about/page.tsx`**：签名行改掉；其余内容已走 `siteConfig` 占位符，保留
8. **`package.json`**：`name` → `fblog-framework`
9. **`wrangler.toml`**：`name` → `fblog-framework`，D1 `database_name`/`database_id` 改为占位符（部署者自建 D1 后填写）
10. **`README.md`**：新写一份简短通用版（快速开始、site.ts 配置说明、文章发布方式、D1/后台部署说明）
11. **不改**：`functions/_lib/api.js` 的 cookie 名 `fbz_admin`、salt 默认值、`scripts/check-theme.cjs` 的 `fbz-theme` localStorage 键、`db/*.sql` 注释里的数据库名示例——这些是框架内部任意标识符，不承载个人信息，改名反而引入风险；仅在 README/wrangler 注释里说明实际数据库名以 `wrangler.toml` 为准

## 三、新示例文章

新写 `src/content/hello-world.mdx`，一篇完整演示框架能力的示例：

- `export const metadata = { title, date, description, tags }` 完整格式
- 覆盖：标题层级、段落、有序/无序列表、引用、行内代码、带语言的代码块、表格、图片（用 `public/images/` 下的已有资源或占位说明）
- 标签用 1-2 个通用标签（如「示例」）
- 遵循工作区博文写作规范（具体、不模板化）

## 四、验证

1. 新目录 `pnpm install`
2. `pnpm typecheck`、`pnpm lint`、`pnpm test`
3. `pnpm build`（静态导出，CI 同款验证路径）
4. grep 复查新目录无 `风不止|mclll114|lll114514|site-logo.jpg` 残留
5. `pnpm dev` + 无头浏览器抽查：首页、文章列表、示例文章详情（代码块/目录正常）、`/lab`、`/about` 渲染正常（遵守本地验证环境规则：独立 user-data-dir，只杀自己启动的进程树）

## 交付物

- `C:\Users\Lecoo\source\repos\fblog-framework`：完整可运行的通用框架，含一篇示例文章、占位符配置
- 原仓库零改动
