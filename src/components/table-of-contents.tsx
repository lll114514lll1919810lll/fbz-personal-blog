"use client";

import { useMemo, useState } from "react";
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

/**
 * 把扁平的目录条目组织成「二级标题 + 其下三级标题」的树。
 *
 * h3 归属于它前面最近的那个 h2；如果开头出现 h3（没有父级），
 * 归入一个匿名分组，避免层级丢失。
 */
type TocNode = {
  id: string;
  text: string;
  children: TocItem[];
};

function buildTree(items: TocItem[]): TocNode[] {
  const nodes: TocNode[] = [];
  let current: TocNode | null = null;

  for (const item of items) {
    if (item.depth === 2) {
      current = { id: item.id, text: item.text, children: [] };
      nodes.push(current);
    } else {
      if (!current) {
        current = { id: "", text: "", children: [] };
        nodes.push(current);
      }
      current.children.push(item);
    }
  }

  // 丢掉匿名空分组（既没有标题也没有子项）
  return nodes.filter((n) => n.id || n.children.length > 0);
}

/**
 * 桌面端侧栏：目录树，h3 默认折叠。
 *
 * 长文章常有几十个三级标题，全部铺开会把侧栏撑得很长、挤占正文视野，
 * 所以默认只显示二级标题，点某个二级标题才展开它的子项。
 */
function Sidebar({ items }: { items: TocItem[] }) {
  const activeId = useActiveHeading(items);
  const tree = useMemo(() => buildTree(items), [items]);

  // 记录哪些分组处于展开状态。默认全空 = 全部折叠。
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 滚动到某个三级标题时，自动展开它所属的分组，
  // 否则高亮的条目在折叠状态下看不见，读者会困惑「高亮去哪了」。
  const activeNode = tree.find(
    (n) => n.id === activeId || n.children.some((c) => c.id === activeId),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isOpen = (node: TocNode) =>
    expanded.has(node.id) ||
    // 当前高亮落在该分组内时，强制展开
    (activeNode?.id === node.id &&
      node.children.some((c) => c.id === activeId));

  return (
    <nav
      aria-label="本文目录"
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-6"
    >
      <p className="mb-3 text-xs font-medium tracking-wide text-muted">
        本文目录
      </p>

      <ul className="space-y-0.5 border-l border-border">
        {tree.map((node) => {
          const open = isOpen(node);
          const hasChildren = node.children.length > 0;
          const active = activeId === node.id;

          return (
            <li key={node.id || node.text}>
              <div className="flex items-start">
                <a
                  href={`#${node.id}`}
                  aria-current={active ? "location" : undefined}
                  className={`-ml-px flex-1 border-l py-1.5 pr-1 text-[13px] leading-snug break-words transition-colors ${
                    active
                      ? "border-accent font-medium text-accent"
                      : "border-transparent text-secondary hover:text-foreground"
                  }`}
                >
                  {node.text}
                </a>

                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggle(node.id)}
                    aria-expanded={open}
                    aria-label={`${open ? "收起" : "展开"}${node.text}的子章节`}
                    className="-ml-px flex shrink-0 items-center self-stretch border-l border-transparent py-1.5 pl-1.5 text-muted transition-colors hover:text-foreground"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                    >
                      <path
                        d="M4.5 2.5L8 6l-3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {hasChildren && open && (
                <ul className="space-y-0.5">
                  {node.children.map((child) => (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        aria-current={
                          activeId === child.id ? "location" : undefined
                        }
                        className={`-ml-px block border-l py-1.5 pl-6 pr-1 text-[13px] leading-snug break-words transition-colors ${
                          activeId === child.id
                            ? "border-accent font-medium text-accent"
                            : "border-transparent text-secondary hover:text-foreground"
                        }`}
                      >
                        {child.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * 移动端折叠版：整体收进一个按钮里，展开后同样是「二级标题 + 可展开子项」。
 *
 * 只有整体展开后才启用滚动高亮，收起时不浪费观察器。
 */
function Collapsible({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const activeId = useActiveHeading(open ? items : []);
  const tree = useMemo(() => buildTree(items), [items]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const activeNode = tree.find(
    (n) => n.id === activeId || n.children.some((c) => c.id === activeId),
  );

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          {tree.length} 节
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
          {tree.map((node) => {
            const hasChildren = node.children.length > 0;
            const groupOpen =
              expanded.has(node.id) ||
              (activeNode?.id === node.id &&
                node.children.some((c) => c.id === activeId));

            return (
              <li key={node.id || node.text}>
                <div className="flex items-start">
                  <a
                    href={`#${node.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex-1 py-1.5 text-sm transition-colors ${
                      activeId === node.id
                        ? "font-medium text-accent"
                        : "text-secondary hover:text-foreground"
                    }`}
                  >
                    {node.text}
                  </a>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(node.id)}
                      aria-expanded={groupOpen}
                      aria-label={`${groupOpen ? "收起" : "展开"}${node.text}的子章节`}
                      className="flex shrink-0 items-center self-stretch py-1.5 pl-2 text-muted transition-colors hover:text-foreground"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden
                        className={`transition-transform duration-200 ${groupOpen ? "rotate-90" : ""}`}
                      >
                        <path
                          d="M4.5 2.5L8 6l-3.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {hasChildren && groupOpen && (
                  <ul className="space-y-0.5">
                    {node.children.map((child) => (
                      <li key={child.id}>
                        <a
                          href={`#${child.id}`}
                          onClick={() => setOpen(false)}
                          className={`block py-1.5 pl-5 text-sm transition-colors ${
                            activeId === child.id
                              ? "font-medium text-accent"
                              : "text-secondary hover:text-foreground"
                          }`}
                        >
                          {child.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}