"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * 代码块的交互层：折叠按钮、复制按钮、语言标签、横向滚动渐变提示。
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

/**
 * 低于这个高度就不给折叠按钮。
 *
 * 十来行的代码块折起来没有意义，多一个按钮只会让工具条变吵；
 * 真正需要折叠的是那种几十行、占掉一整屏的配置和脚本。
 */
const FOLD_MIN_HEIGHT = 420;

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
  /** 够不够高、值不值得给一个折叠按钮 */
  const [foldable, setFoldable] = useState(false);
  /** 默认展开；只有用户点了折叠才会变 true */
  const [collapsed, setCollapsed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyId = useId();

  // 量两件事：是否横向溢出（决定右侧渐变），以及是否需要折叠按钮
  useEffect(() => {
    const el = preRef.current;
    if (!el) return;

    const check = () => {
      // 留 1px 容差，避免亚像素误差导致的误判
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      // scrollHeight 是内容总高，不受 max-height 限制，
      // 所以折叠状态下量到的仍是完整高度，按钮不会自己消失
      setFoldable(el.scrollHeight > FOLD_MIN_HEIGHT);
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
    <div
      className={`code-block group relative${collapsed ? " is-collapsed" : ""}`}
      data-language={language}
      // 折叠后底部渐变要给横向滚动条让位，所以标记一下
      data-overflow-x={overflowing || undefined}
    >
      {/* 右上角操作区：语言标签 + 折叠 / 复制按钮 */}
      <div className="code-block-toolbar">
        {language && <span className="code-block-lang">{language}</span>}

        <div className="code-block-actions">
          {foldable && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              aria-label={collapsed ? "展开代码" : "折叠代码"}
              className="code-block-action code-block-fold"
            >
              <ChevronIcon up={!collapsed} />
              {collapsed ? "展开" : "折叠"}
            </button>
          )}

          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "已复制代码" : "复制代码"}
            className="code-block-action code-block-copy"
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
      </div>

      <pre
        ref={preRef}
        id={bodyId}
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

      {/* 底部渐变：折叠时提示下面还有内容 */}
      {foldable && collapsed && (
        <div className="code-block-collapse-fade" aria-hidden />
      )}
    </div>
  );
}

/** 折叠 / 展开的箭头：箭头方向跟着按钮文案走。
 *  展开态标着「折叠」，箭头朝上（收起 = 往上收）；
 *  折叠态标着「展开」，箭头朝下（展开 = 往下放）。 */
function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={`transition-transform duration-200 ${up ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
