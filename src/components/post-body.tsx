"use client";

import type { ReactNode } from "react";
import { TableOfContents } from "@/components/table-of-contents";
import { READING_WIDTHS, useReadingWidth } from "@/lib/reading-width";
import type { TocItem } from "@/lib/posts";

/**
 * 文章主体区域。
 *
 * 正文宽度由用户在浏览器里调节，所以这部分必须是客户端组件；
 * MDX 的渲染结果作为 children 传进来，仍然是服务端渲染的。
 *
 * 宽度状态只能在这一个组件里维护：如果「切换按钮」和「正文容器」
 * 各自调用 useReadingWidth，那是两个互不相干的 state，
 * 点按钮不会让正文变宽。
 */
export function PostBody({
  toc,
  header,
  footer,
  children,
}: {
  toc: TocItem[];
  /** 文章头部（标题、摘要、元信息），由 server 组件渲染 */
  header: ReactNode;
  /** 文章末尾（上一篇/下一篇），由 server 组件渲染 */
  footer: ReactNode;
  children: ReactNode;
}) {
  const { widthId, setWidth } = useReadingWidth();
  const width =
    READING_WIDTHS.find((w) => w.id === widthId) ?? READING_WIDTHS[1];
  const currentIndex = READING_WIDTHS.findIndex((w) => w.id === widthId);
  const next = READING_WIDTHS[(currentIndex + 1) % READING_WIDTHS.length];

  return (
    <div className="flex flex-col gap-8">
      {/* 移动端：目录收在折叠按钮里 */}
      <div className="xl:hidden">
        <TableOfContents variant="collapsible" items={toc} />
      </div>

      {/* 正文宽度 = 正文栏 + 固定宽的目录侧栏。
          用 items-start + justify-center 让整块内容居中，
          调宽度时正文跟着变宽，两侧留白重新分配。 */}
      <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-center xl:gap-12">
        {/* w-full 而不是 flex-1：让 maxWidth 真正生效。
            flex-1 会把元素撑满可用空间，maxWidth 就形同虚设。

            panel-strong：整篇文章是一块阅读面板，用更实的底
            （0.86 而不是 0.72），长文叠在背景图上才不费眼。 */}
        <article
          className="panel panel-strong w-full min-w-0 px-5 py-6 transition-[max-width] duration-300 ease-out sm:px-7"
          style={{ maxWidth: width.maxWidth }}
        >
          {header}

          <div className="pb-4">
            <WidthControl
              label={width.label}
              hint={width.hint}
              currentIndex={currentIndex}
              onAdvance={() => setWidth(next.id)}
              nextLabel={next.label}
            />
          </div>

          <div className="prose border-t border-border pt-8">{children}</div>

          <div className="mt-12">{footer}</div>
        </article>

        {/*
          桌面端目录侧栏。
          self-stretch 必须显式写出来：上一行的 items-start 会让这一格
          高度只等于目录自身（约 360px），而 position:sticky 只能在
          它的包裹层范围内生效——滚过那段高度目录就跟着消失了。
          拉伸到整行高度后，sticky 才有足够的行程。
        */}
        <div className="hidden w-64 shrink-0 xl:block xl:self-stretch">
          <TableOfContents variant="sidebar" items={toc} />
        </div>
      </div>
    </div>
  );
}

/** 宽度调节条：档位指示 + 切换按钮 + 文字提示，三重视觉提示。 */
function WidthControl({
  label,
  hint,
  currentIndex,
  onAdvance,
  nextLabel,
}: {
  label: string;
  hint: string;
  currentIndex: number;
  onAdvance: () => void;
  nextLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <p className="text-[13px] text-muted">
        正文宽度 · <span className="text-secondary">{hint}</span>
      </p>

      <div className="flex items-center gap-2">
        {/* 三格高度指示器：直观表示档位数量和当前位置 */}
        <div className="flex items-end gap-[3px]" aria-hidden>
          {READING_WIDTHS.map((w, i) => (
            <span
              key={w.id}
              className={`w-[3px] rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? "h-3.5 bg-accent"
                  : i < currentIndex
                    ? "h-2 bg-muted"
                    : "h-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onAdvance}
          title={`当前「${label}」：${hint}。点击切换为「${nextLabel}」`}
          /* min-h-8（32px）保证触控热区达标：按钮本身字很小，
             但手机上一根手指点下去需要足够的面积 */
          className="group flex min-h-8 items-center gap-1 rounded-md border border-panel-edge bg-panel-raised px-2.5 py-1.5 text-[12px] text-secondary backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
        >
          <span className="tabular-nums">{label}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden
            className="text-muted transition-transform duration-300 group-hover:rotate-90"
          >
            <path
              d="M3 1.5L6 5L3 8.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span className="sr-only">
          正文宽度：{label}，{hint}。当前选项。
        </span>
      </div>
    </div>
  );
}