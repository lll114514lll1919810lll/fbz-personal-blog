-- 评论表。
--
-- 应用方式（二选一，按目标环境）：
--   本地：npx wrangler d1 execute fbz-blog-comments --local  --file=db/schema.sql
--   线上：npx wrangler d1 execute fbz-blog-comments --remote --file=db/schema.sql
--
-- 重复执行安全：全部 IF NOT EXISTS。
--
-- 已有数据库升级用 db/migrations/ 下的脚本（本文件只负责全新安装）。

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 页面标识。本站用文章 slug（如 4-dsh-opencode-free-models）。
  -- 后端会用 PAGE_RE 再校验一次，这里不加约束是为了将来换标识方式时
  -- 不必改表结构。
  page       TEXT NOT NULL,

  -- 回复关系（邻接表）。
  --   NULL  = 顶层留言
  --   非空  = 所回复的**顶层留言**的 id
  --
  -- 刻意限制成两层：回复「回复」时，后端会把 parent_id 归一化到根留言，
  -- 于是它成为同一层里的兄弟回复。博客评论区不需要无限嵌套——
  -- 手机上缩进几层就没法读了，而且深树会让「删除中间层」的语义变复杂。
  parent_id  INTEGER,

  name       TEXT NOT NULL,

  text       TEXT NOT NULL,

  -- 访客 IP 的加盐哈希，仅用于限流，不存原始 IP。
  -- 见 functions/_lib/api.js 的 ipHashOf()。
  ip_hash    TEXT NOT NULL,

  -- SQLite 的 datetime('now') 返回 UTC 的 "YYYY-MM-DD HH:MM:SS"。
  -- 读取时会在 SQL 里转成 ISO 8601（见 comments.js），前端无需猜时区。
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 列表查询固定是「按 page 过滤 + 按 id 倒序」，建复合索引让它走覆盖扫描；
-- 同时这个索引也服务于限流的 ip_hash 计数之外的 page 维度查询。
CREATE INDEX IF NOT EXISTS idx_comments_page_id ON comments (page, id DESC);

-- 限流要按 ip_hash + 时间窗口计数，单独给它一个索引。
CREATE INDEX IF NOT EXISTS idx_comments_ip_created
  ON comments (ip_hash, created_at);

-- 删除顶层留言时要级联删掉它的回复，按 parent_id 找子项需要索引。
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
