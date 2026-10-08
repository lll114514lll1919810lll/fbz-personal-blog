"use client";

import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/time";

/**
 * 文章底部的评论區。
 *
 * 这是全站**唯一**需要服务端的地方：页面本身仍然是静态预渲染的 HTML，
 * 评论在浏览器里向 /api/comments 取。对应后端是 functions/api/comments.js
 * （Cloudflare Pages Functions + D1），不进 Next 构建，所以静态导出不受影响。
 *
 * 三种拿不到数据的场景要分开对待，提示语完全不同：
 * - 本地 pnpm dev：没有 Functions，接口 404 → 「评论功能需本地 wrangler 启动」
 * - 线上没配 D1 绑定：接口 503 → 直接用后端返回的说明
 * - 网络抖动：fetch 抛异常 → 提示重试
 * 全都归成一句「加载失败」的话，排查时会很痛苦。
 */

type Comment = {
  id: number;
  name: string;
  text: string;
  created_at: string; // ISO 8601（后端已在 SQL 里转好）
};

type Status = "loading" | "ready" | "unavailable" | "error";

const MAX_TEXT = 500;
const MAX_NAME = 24;

export function Comments({ page }: { page: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");
  /** 是否跑在本机（决定显示开发者提示还是访客提示） */
  const [isLocal, setIsLocal] = useState(false);

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const textRef = useRef<HTMLTextAreaElement>(null);

  /*
   * 取评论列表。
   *
   * 所有 setState 都写在 await 之后：effect 里同步 setState 会触发
   * react-hooks/set-state-in-effect（多一轮级联渲染），本站的
   * reading-width 也是为此改用 useSyncExternalStore 的。
   *
   * AbortController 负责取消在途请求——否则网络慢时用户已经切走文章，
   * 旧请求回来仍会对已卸载组件 setState。重试和提交后刷新都靠
   * reloadKey 递增重新触发本 effect，而不是另外维护一个 load 函数。
   */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/comments?page=${encodeURIComponent(page)}`,
          { headers: { accept: "application/json" }, signal: controller.signal },
        );

        // 404：本地 pnpm dev 没有 Functions；503：线上没配 D1 绑定
        if (res.status === 404 || res.status === 503) {
          const body = await res.json().catch(() => null);
          if (controller.signal.aborted) return;
          setNotice(body?.error || "");
          // 线上页面只对访客说一句人话，具体原因留在 console 供站主排查
          console.warn(
            `[comments] 接口不可用（HTTP ${res.status}）：${body?.error || "无详细信息"}`,
          );

          /*
           * 是否本机开发，只在这条分支里判断。
           *
           * 不能在渲染期读 window.location —— 服务端渲染时没有 window，
           * 客户端首次渲染却读得到，两边结果不同就会 hydration 不一致。
           * 而 unavailable 这个状态只在客户端 fetch 之后才可能出现，
           * 在这里判断天然安全。
           */
          setIsLocal(
            /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname),
          );
          setStatus("unavailable");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));

        const list = await res.json();
        // 后端出错时会返回错误对象而不是数组，这里挡一道，
        // 否则下面的 map 会直接抛错、整块评论变成白屏
        if (!Array.isArray(list)) throw new Error("bad payload");

        if (controller.signal.aborted) return;
        setComments(list);
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, [page, reloadKey]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const trimmed = text.trim();
    if (!trimmed) {
      setNotice("留言内容不能为空");
      textRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setNotice("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page, name, text: trimmed }),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setNotice(body?.error || "提交失败，请稍后再试");
        return;
      }

      setText("");
      setNotice("留言成功");
      // 递增 reloadKey 让上面的 effect 重新拉一次列表，
      // 保证刚发的这条（以及别人的新留言）立刻出现
      setReloadKey((k) => k + 1);
    } catch {
      setNotice("提交失败，请检查网络后重试");
    } finally {
      setSubmitting(false);
    }
  }

  const total = comments.length;

  return (
    <section
      aria-labelledby="comments-heading"
      className="mt-12 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">DISCUSSION</p>
          <h2 id="comments-heading" className="mt-2 text-xl font-semibold">
            留言
            {status === "ready" && total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted">{total}</span>
            )}
          </h2>
        </div>
        {/* 这句是在承诺「可以留言」，服务不可用时不该出现——
            否则访客会去找一个根本不存在的输入框 */}
        {status === "ready" && (
          <p className="text-xs text-muted">无需登录，昵称可留空</p>
        )}
      </div>

      {/* 表单：只有服务可用时才呈现，避免本地开发看到一个必然失败的输入框 */}
      {status === "ready" && (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="sr-only" htmlFor="comment-name">
            昵称（可留空）
          </label>
          <input
            id="comment-name"
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="昵称（可留空，默认「路人」）"
            autoComplete="nickname"
            className="field-input"
          />

          <label className="sr-only" htmlFor="comment-text">
            留言内容
          </label>
          <textarea
            id="comment-text"
            ref={textRef}
            value={text}
            rows={4}
            maxLength={MAX_TEXT}
            onChange={(e) => setText(e.target.value)}
            placeholder="说点什么…"
            className="field-input resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* aria-live：提交结果要让读屏用户也听得到 */}
            <p aria-live="polite" className="min-h-5 text-xs text-muted">
              {notice}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted tabular-nums">
                {text.length}/{MAX_TEXT}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn-pill"
              >
                {submitting ? "发送中…" : "发表"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 状态提示 */}
      {status === "loading" && (
        <p className="mt-6 text-sm text-muted">正在加载留言…</p>
      )}

      {/*
        服务不可用时分两种口吻：
        - 本机开发：给出具体原因和启动命令，否则浪费时间猜
        - 线上：只对访客说一句人话。后端的报错（缺 D1 绑定之类）是给站主看的，
          直接晾在页面上访客只会困惑，所以写进 console 供排查。
      */}
      {status === "unavailable" &&
        (isLocal ? (
          <p className="mt-6 text-sm text-muted">
            {notice || "评论服务尚未配置。"}
            <span className="mt-1 block text-xs">
              本地预览请用{" "}
              <code className="rounded bg-surface px-1">
                npx wrangler pages dev out
              </code>
              ，直接 <code className="rounded bg-surface px-1">pnpm dev</code>{" "}
              不会启动接口。
            </span>
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted">留言功能暂时不可用，稍后再来看看。</p>
        ))}

      {status === "error" && (
        <div className="mt-6">
          <p className="text-sm text-muted">留言加载失败。</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn-pill mt-3"
          >
            重试
          </button>
        </div>
      )}

      {/* 列表 */}
      {status === "ready" && total === 0 && (
        <p className="mt-6 text-sm text-muted">还没有留言，来做第一个。</p>
      )}

      {status === "ready" && total > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {comments.map((c) => (
            <li
              key={c.id}
              /* panel-raised 是「叠在别的面板之上」的层级——
                 本组件位于文章面板内部，用它会得到正确的视觉层次，
                 而不是再嵌一层 .panel（嵌套面板会在接缝处露出弧度） */
              className="panel-raised panel rounded-[var(--radius-panel)] px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-medium">{c.name}</span>
                <time dateTime={c.created_at} className="text-xs text-muted">
                  {relativeTime(c.created_at)}
                </time>
              </div>
              {/* whitespace-pre-wrap 保留用户输入的换行；
                  break-words 防止超长无空格串（URL）撑破面板 */}
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary">
                {c.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
