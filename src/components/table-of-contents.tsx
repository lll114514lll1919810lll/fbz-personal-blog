"use client";

import { useState } from "react";
import type { TocItem } from "@/lib/posts";
import { useActiveHeading } from "./use-active-heading";

/**
 * 文章目录的两种形态：
 * - sidebar：桌面端，贴在正文右侧，滚动时高亮当前小节
 * - collapsible：移动端，收进一个可折叠按钮里，侧栏在窄屏没有空间
 *
 * 由调用方用断点决定渲染哪一种，各自只挂载一次观察器。
 */
export function TableOfContents({
  items,
  variant,
}: {
  items: TocItem[];
  variant: "sidebar" | "collapsible";
}) {
  // 少于两节的目录没有导航价值，直接不渲染
  if (items.length < 2) return null;

  return variant === "sidebar" ? (
    <Sidebar items={items} />
  ) : (
    <Collapsible items={items} />
  );
}

/** 桌面端侧栏：始终启用滚动高亮。 */
function Sidebar({ items }: { items: TocItem[] }) {
  const activeId = useActiveHeading(items);

  return (
    <nav
      aria-label="本文目录"
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-6"
    >
      <p className="mb-3 text-xs font-medium tracking-wide text-muted">
        本文目录
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "location" : undefined}
              className={`-ml-px block border-l py-1.5 text-[13px] leading-snug break-words transition-colors ${
                item.depth === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === item.id
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-secondary hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 移动端折叠版：展开时才启用滚动高亮，收起时不浪费观察器。 */
function Collapsible({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const activeId = useActiveHeading(open ? items : []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:bg-surface"
      >
        <span className="font-medium">本文目录</span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {items.length} 节
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M2.5 4.5L6 8l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <ul className="mt-2 space-y-0.5 rounded-lg border border-border bg-surface p-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className={`block py-1.5 text-sm transition-colors ${
                  item.depth === 3 ? "pl-5" : "pl-2"
                } ${
                  activeId === item.id
                    ? "font-medium text-accent"
                    : "text-secondary hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}