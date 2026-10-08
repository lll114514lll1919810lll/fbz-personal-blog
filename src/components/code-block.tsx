"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 代码块的交互层：复制按钮、语言标签、横向滚动渐变提示。
 *
 * 高亮本身是构建期完成的（rehype-pretty-code + Shiki），
 * 这个组件只负责交互，因此整个代码块不需要客户端重渲染正文——
 * 代码文本是服务端渲染好的 HTML。
 */
/** pre 上会多带一个 data-language（由 rehype-pretty-code 注入） */
type CodeBlockProps = React.HTMLAttributes<HTMLElement> & {
  /** 语言名，来自 pre 的 data-language，用于显示标签 */
  language?: string;
};

export function CodeBlock({
  children,
  className,
  language,
  ...props
}: CodeBlockProps) {
  // data-language 已经转成 language 单独用了，从透传里剔除，
  // 避免同一个属性既写到外层容器又写到 pre 上
  const { ["data-language"]: _discard, ...rest } = props as Record<
    string,
    unknown
  >;
  void _discard;
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 检测是否横向溢出，据此决定要不要显示右侧渐变提示
  useEffect(() => {
    const el = preRef.current;
    if (!el) return;

    const check = () => {
      // 留 1px 容差，避免亚像素误差导致的误判
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // 组件卸载时清掉定时器，避免内存泄漏
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    // 从 pre 里取纯文本：textContent 会带换行，但不含行号等装饰
    const text = preRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // 非安全上下文（http 局域网访问）下 clipboard 不可用，静默失败
      // 不做 alert 之类的打断，鼠标用户仍可手动选中复制
    }
  }, []);

  return (
    <div className="code-block group relative" data-language={language}>
      {/* 右上角操作区：语言标签 + 复制按钮 */}
      <div className="code-block-toolbar">
        {language && <span className="code-block-lang">{language}</span>}

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "已复制代码" : "复制代码"}
          className="code-block-copy"
          data-copied={copied || undefined}
        >
          {copied ? (
            <>
              <CheckIcon />
              已复制
            </>
          ) : (
            <>
              <CopyIcon />
              复制
            </>
          )}
        </button>
      </div>

      <pre
        ref={preRef}
        className={className}
        tabIndex={0}
        {...rest}
      >
        {children}
      </pre>

      {/* 右侧渐变：只在代码横向溢出时出现，提示还有内容没显示完 */}
      {overflowing && (
        <div className="code-block-fade" aria-hidden />
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="4.5"
        y="4.5"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M9.5 2.5v-.5a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7.5L5.8 10.2L11 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}