/**
 * 评论接口（Cloudflare Pages Functions + D1）
 *
 *   GET    /api/comments?page=<slug>                         列出某篇文章的评论
 *   POST   /api/comments   { page, name, text, parent_id? }  发表评论或回复
 *   DELETE /api/comments?id=<id>&key=<ADMIN_KEY>             管理员删除（级联删回复）
 *
 * 设计取舍：
 * - 不做登录。个人博客的评论用「匿名 + 昵称 + 限流 + 管理密钥」就够了，
 *   引入账号体系会让九成想留言的人直接放弃。
 * - 昵称可选，留空记作「路人」。
 * - 只存 IP 的哈希，不存原始 IP（见 _lib/api.js 的 ipHashOf）。
 * - 回复只做两层，见 _lib/api.js 的 resolveReplyTarget。
 */

import {
  adminAuthorized,
  countRecent,
  createHandlers,
  deleteCommentCascade,
  ipHashOf,
  json,
  LIST_LIMIT,
  originAllowed,
  PAGE_RE,
  RATE_LIMIT,
  RATE_WINDOW_MIN,
  readJson,
  resolveReplyTarget,
  validateComment,
} from "../_lib/api.js";

const TABLE = "comments";

async function handle(request, env, url) {
  const origin = originAllowed(request, env);
  if (origin === null) return json({ error: "来源不允许" }, 403);

  // D1 绑定缺失时给出明确提示，而不是让 prepare 抛一个看不懂的错误。
  // 最常见的原因是忘了在 Pages 项目里配 D1 绑定。
  if (!env.DB) {
    return json({ error: "评论服务未配置数据库（缺少 D1 绑定 DB）" }, 503, origin);
  }

  /* ------------------------------------------------------------ 列表 --- */
  if (request.method === "GET") {
    const page = url.searchParams.get("page") || "";
    if (!PAGE_RE.test(page)) return json({ error: "页面标识不合法" }, 400, origin);

    // created_at 统一在 SQL 里转成 ISO 8601（带 T 和 Z），
    // 免得前端还要猜 SQLite datetime() 的 "YYYY-MM-DD HH:MM:SS" 是哪个时区。
    //
    // admin_badge 对外可读、不可写：访客界面靠它渲染金色徽标，
    // 而写入只走管理接口（PATCH /api/admin/comments）。
    // 下面的 INSERT 刻意不列这一列——新留言永远是 0，请求体伪造不了。
    const res = await env.DB.prepare(
      `SELECT id, parent_id, name, text, admin_badge,
              strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at
         FROM ${TABLE}
        WHERE page = ?1
        ORDER BY id DESC
        LIMIT ${LIST_LIMIT}`,
    )
      .bind(page)
      .all();

    return json(res.results || [], 200, origin);
  }

  /* ------------------------------------------------------------ 发表 --- */
  if (request.method === "POST") {
    const body = await readJson(request);
    if (!body) return json({ error: "请求格式不对" }, 400, origin);

    const page = String(body.page || "");
    const name = String(body.name || "").trim() || "路人";
    const text = String(body.text || "").trim();

    const bad = validateComment({ page, name, text });
    if (bad) return json(bad, 400, origin);

    // parent_id 可选：不传就是顶层留言
    let parentId = null;
    if (body.parent_id !== undefined && body.parent_id !== null) {
      const raw = Number(body.parent_id);
      if (!Number.isInteger(raw) || raw <= 0) {
        return json({ error: "回复目标不合法" }, 400, origin);
      }
      const target = await resolveReplyTarget(env.DB, TABLE, page, raw);
      if (target.error) return json({ error: target.error }, 400, origin);
      parentId = target.rootId;
    }

    const ipHash = await ipHashOf(request, env);

    const recent = await countRecent(env.DB, TABLE, ipHash, RATE_WINDOW_MIN);
    if (recent >= RATE_LIMIT) {
      return json(
        { error: `${RATE_WINDOW_MIN} 分钟内最多发 ${RATE_LIMIT} 条，歇一会儿再来` },
        429,
        origin,
      );
    }

    await env.DB.prepare(
      `INSERT INTO ${TABLE} (page, parent_id, name, text, ip_hash)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
      .bind(page, parentId, name, text, ipHash)
      .run();

    return json({ ok: true }, 200, origin);
  }

  /* ------------------------------------------------------------ 删除 --- */
  if (request.method === "DELETE") {
    if (!adminAuthorized(url, request, env)) {
      return json({ error: "无权操作" }, 403, origin);
    }

    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return json({ error: "id 不合法" }, 400, origin);
    }

    const removed = await deleteCommentCascade(env.DB, TABLE, id);
    if (!removed) return json({ error: "留言不存在" }, 404, origin);

    return json({ ok: true, removed }, 200, origin);
  }

  return json({ error: "不支持的请求方法" }, 405, origin);
}

export const { onRequestGet, onRequestPost, onRequestDelete, onRequestOptions } =
  createHandlers(handle);
