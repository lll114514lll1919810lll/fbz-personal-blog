/**
 * 评论接口的共用模块。
 *
 * 运行在 Cloudflare Pages Functions 上（不是 Node，也不是 Next.js 运行时）：
 * 只有 Web 标准 API（Request / Response / crypto.subtle）和 D1 绑定可用。
 *
 * 这一层刻意与 Next.js 完全无关——functions/ 目录不进 Next 构建，
 * 所以博客本体仍然是 output: "export" 的纯静态站。
 */

/* --------------------------------------------------------------- 配置 --- */

/** 同一 IP 在窗口期内最多发几条 */
export const RATE_LIMIT = 3;
/** 限流窗口（分钟） */
export const RATE_WINDOW_MIN = 10;
export const MAX_TEXT = 500;
export const MAX_NAME = 24;
export const LIST_LIMIT = 200;

/**
 * page 标识的白名单。
 * 本站用文章 slug（如 4-dsh-opencode-free-models）作为页面标识，
 * 只允许字母数字和连字符/下划线，避免任意字符串被写进库。
 */
export const PAGE_RE = /^[A-Za-z0-9_-]{1,64}$/;

/* ------------------------------------------------------------- 响应 --- */

function corsHeaders(origin) {
  return {
    ...(origin ? { "access-control-allow-origin": origin } : {}),
    // 同一个 URL 可能因 Origin 不同返回不同的 CORS 头，
    // 不加 Vary 会被缓存串味
    vary: "Origin",
  };
}

/**
 * 统一 JSON 响应。
 *
 * x-content-type-options: nosniff 不能省——评论内容是用户输入，
 * 万一有代理/浏览器做内容嗅探，JSON 被当成 HTML 执行就是存储型 XSS。
 */
export function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...corsHeaders(origin),
    },
  });
}

/* --------------------------------------------------------------- CORS --- */

/**
 * 判断请求来源是否放行，返回应当回填的 Allow-Origin；不放行返回 null。
 *
 * 线上评论接口和页面同源，其实用不到 CORS；这里主要是为了本地开发——
 * `pnpm dev` 跑在 :3000，而 `wrangler pages dev` 跑在 :8788，属于跨源。
 * 额外放行的来源通过环境变量 ALLOWED_ORIGINS 配置（逗号分隔），
 * 不写死任何域名。
 */
export function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  // 没有 Origin：同源的 GET，或 curl 这类非浏览器请求，直接放行
  if (!origin) return "";

  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return null;
  }

  if (host === new URL(request.url).host) return origin;

  const extra = String((env && env.ALLOWED_ORIGINS) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return extra.includes(origin) ? origin : null;
}

/* --------------------------------------------------------------- 输入 --- */

/** 安全地读取 JSON body：解析失败或不是对象都返回 null，不抛异常。 */
export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

/**
 * 校验评论内容，通过返回 null，否则返回 { error }。
 *
 * 长度用 Array.from 按「码点」计数而不是 .length：
 * .length 数的是 UTF-16 码元，emoji 之类会被算成 2 个，中英文混排时
 * 用户会觉得「明明没超却被拒」。
 */
export function validateComment({ page, name, text }) {
  if (!PAGE_RE.test(String(page || ""))) return { error: "页面标识不合法" };

  const t = String(text || "").trim();
  if (!t) return { error: "留言内容不能为空" };
  if (Array.from(t).length > MAX_TEXT) return { error: `留言最多 ${MAX_TEXT} 字` };

  if (Array.from(String(name || "")).length > MAX_NAME) {
    return { error: `昵称最多 ${MAX_NAME} 字` };
  }
  return null;
}

/* ------------------------------------------------------------- 限流 --- */

/**
 * 把访客 IP 转成不可逆的哈希再入库。
 *
 * 限流只需要「同一个 IP 能对上」，不需要知道 IP 是谁，所以存哈希就够了——
 * 数据库里不该留下访客的真实 IP。加盐（IP_SALT）是防止有人拿常见 IP 段
 * 反查哈希表。
 */
export async function ipHashOf(request, env) {
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  const salt = String((env && env.IP_SALT) || "fbz-blog-comments");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${ip}`),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 统计某 IP 在最近 windowMinutes 分钟内已发表的条数。 */
export async function countRecent(db, table, ipHash, windowMinutes) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM ${table}
        WHERE ip_hash = ?1 AND created_at >= datetime('now', ?2)`,
    )
    .bind(ipHash, `-${windowMinutes} minutes`)
    .first();
  return row ? row.n : 0;
}

/* --------------------------------------------------------------- 管理 --- */

/**
 * 管理员校验。密钥从环境变量 ADMIN_KEY 读，前端不持有。
 *
 * 比较用逐字节异或累加而不是 === ：字符串比较会在第一个不同的字符处
 * 提前返回，理论上能通过响应时间差逐位猜出密钥（时序侧信道）。
 */
export function adminAuthorized(url, request, env) {
  const expected = String((env && env.ADMIN_KEY) || "");
  if (!expected) return false;

  const provided = String(
    url.searchParams.get("key") || request.headers.get("x-admin-key") || "",
  );
  if (provided.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/* -------------------------------------------------------------- 入口 --- */

/**
 * 把统一的 handle(request, env, url) 适配成 Pages Functions 的
 * onRequest* 导出，顺带统一处理 OPTIONS 预检。
 */
export function createHandlers(handle) {
  const run = (ctx) => handle(ctx.request, ctx.env || {}, new URL(ctx.request.url));

  return {
    onRequestGet: run,
    onRequestPost: run,
    onRequestDelete: run,
    onRequestOptions: ({ request, env }) => {
      const origin = originAllowed(request, env || {});
      if (origin === null) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(origin),
          "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
          "access-control-allow-headers": "content-type,x-admin-key",
          "access-control-max-age": "86400",
        },
      });
    },
  };
}
